const professorCache = new Map();

function checkNameMatch(rmpName, professorName) {
    // This will handle most cases.
    if (rmpName.toLowerCase() !== professorName.toLowerCase()) {
        return true;
    } else {
        // TODO handle edge cases
        //  * initials being used on university site
        //  * middle name listed on RMP
        //  * hyphen in parts of name on RMP or off of it
        //  * partial name matches (nicknames in university site, full name on RMP, etc...)
        return false;
    }
}
function normalDistributionRandom(min, max) {
    // Box-Muller transform to generate normally distributed random numbers
    function boxMullerTransform() {
        const u1 = Math.random();
        const u2 = Math.random();

        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0;
    }

    // Generate a random number with standard normal distribution (mean = 0, std dev = 1)
    const standardNormal = boxMullerTransform();

    // Scale and shift the standard normal to fit the desired range
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 6; // Assuming 99.7% of values fall within the range (3 standard deviations)

    let result = standardNormal * stdDev + mean;

    // Clamp the result to ensure it falls within the specified range
    result = Math.max(min, Math.min(max, result));

    return result;
}

function searchProfessor(name, schoolID, schoolNameWebEncoded, useCache = true) {
    return new Promise((resolve, reject) => {
        if (useCache && professorCache.get(name) !== undefined) {
            console.log("Cache hit for professor " + name + ": " + professorCache.get(name))
            resolve(professorCache.get(name))
        }

        // Base64 encode the schoolID
        const encodedSchoolId = btoa(`School-${schoolID}`);

        // GraphQL query
        const query = `query NewSearchTeachersQuery(
  $query: TeacherSearchQuery!
  $count: Int
) {
  newSearch {
    teachers(query: $query, first: $count) {
      didFallback
      edges {
        cursor
        node {
          id
          legacyId
          firstName
          lastName
          department
          departmentId
          school {
            legacyId
            name
            id
          }
          ...CompareProfessorsColumn_teacher
        }
      }
    }
  }
}

fragment CompareProfessorsColumn_teacher on Teacher {
  id
  legacyId
  firstName
  lastName
  school {
    legacyId
    name
    id
  }
  department
  departmentId
  avgRating
  numRatings
  wouldTakeAgainPercentRounded
  mandatoryAttendance {
    yes
    no
    neither
    total
  }
  takenForCredit {
    yes
    no
    neither
    total
  }
  ...NoRatingsArea_teacher
  ...RatingDistributionWrapper_teacher
}

fragment NoRatingsArea_teacher on Teacher {
  lastName
  ...RateTeacherLink_teacher
}

fragment RatingDistributionWrapper_teacher on Teacher {
  ...NoRatingsArea_teacher
  ratingsDistribution {
    total
    ...RatingDistributionChart_ratingsDistribution
  }
}

fragment RatingDistributionChart_ratingsDistribution on ratingsDistribution {
  r1
  r2
  r3
  r4
  r5
}

fragment RateTeacherLink_teacher on Teacher {
  legacyId
  numRatings
  lockStatus
}
`;

        // Prepare the request payload
        const payload = {
            query: query,
            variables: {
                query: {
                    text: name,
                    schoolID: encodedSchoolId
                },
                count: 10
            }
        };

        // Prepare the fetch options
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Host': 'www.ratemyprofessor.com',
                'User-Agent': navigator.userAgent,
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.ratemyprofessors.com',
                'Content-Type': 'application/json',
                'Authorization': 'Basic dGVzdDp0ZXN0',
                'Content-Length': 1525 + normalDistributionRandom(0, 4000),
                'Origin': 'https://www.ratemyprofessors.com',
                'Connection': 'keep-alive',
                'Cookie': 'ccpa-notice-viewed-02=true; userSchoolId=' + encodedSchoolId + '; userSchoolLegacyId=' + schoolID +'; userSchoolName=' + schoolNameWebEncoded + ';',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
            },
            body: JSON.stringify(payload)
        };

        // Use the existing message passing to make the request
        chrome.runtime.sendMessage(
            {
                url: 'https://www.ratemyprofessors.com/graphql',
                options: fetchOptions
            },
            (response) => {
                if (response && response.data && response.data.newSearch && response.data.newSearch.teachers) {
                    const professorData = response.data.newSearch.teachers.edges;
                    console.log("Professor data: " + professorData)
                    if (professorData && professorData.length > 0) {
                        const professor = professorData[0].node;

                        // Prepare the return object
                        const result = {
                            name: `${professor.firstName} ${professor.lastName}`,
                            department: professor.department,
                            school: professor.school.name,
                            avgRating: professor.avgRating,
                            numRatings: professor.numRatings,
                            wouldTakeAgainPercent: professor.wouldTakeAgainPercentRounded,
                            id: professor.legacyId
                        };

                        professorCache.set(name, result);
                        // console.log("Debug to ensure correct # of requests sent")
                        resolve(result);
                    } else {
                        reject(new Error('No professor found'));
                    }
                } else {
                    console.log(response)
                    reject(new Error('Invalid response format'));
                }
            }
        );
    });
}

window.getProfessor = searchProfessor;