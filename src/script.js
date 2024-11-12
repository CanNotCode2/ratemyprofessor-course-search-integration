    let schoolID = 1232;
    let schoolNameWebEncoded = 'The%20University%20of%20North%20Carolina%20at%20Chapel%20Hill';

    async function generateProfRating(fullName) {
        try {
            const result = await searchProfessor(fullName, schoolID, schoolNameWebEncoded);

            let stylingElement = "style='width: 50px;background-color: rgb(100, 181, 246);display: flex;justify-content: center;border-radius: 10px;border-top: 1px solid rgb(30, 136, 229);border-bottom: 3px solid rgb(30, 136, 229);font-size: smaller;font-weight: bold;text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;padding-top: 0.25em;padding-bottom: 0.25em;'";

            let rating = result.avgRating;
            let id = result.id;

            // Check if the professor has no ratings or RMP's returned result has a different name
            if (result.numRatings === 0 || checkNameMatch(result.name, fullName)) {
                return `<td ${stylingElement}><a style='color: white !important;' href=https://www.ratemyprofessors.com/search/professors/${schoolID}?q=${fullName}>search</a></td>`;
            }

            switch (true) {
                case rating >= 4:
                    stylingElement =
                        "style='width: 50px;background-color: rgb(76, 175, 80);display: flex;justify-content: center;border-radius: 10px;border-top: 1px solid rgb(56, 142, 60);border-bottom: 3px solid rgb(56, 142, 60);font-size: larger;font-weight: bold;text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;'";
                    break;
                case rating >= 3:
                    stylingElement =
                        "style='width: 50px;background-color: rgb(255, 235, 59);font-size: larger;font-weight: bold;text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;display: flex;justify-content: center;border-radius: 10px;border-top: 1px solid rgb(251, 192, 45);border-bottom: 3px solid rgb(251, 192, 45);'";
                    break;
                case rating >= 2:
                    stylingElement =
                        "style='width: 50px;background-color: rgb(255, 152, 0);display: flex;justify-content: center;border-radius: 10px;border-top: 1px solid rgb(245, 124, 0);border-bottom: 3px solid rgb(245, 124, 0);font-size: larger;font-weight: bold;text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;'";
                    break;
                case rating >= 1:
                    stylingElement =
                        "style='width: 50px;background-color: rgb(244, 67, 54);display: flex;justify-content: center;border-radius: 10px;border-top: 1px solid rgb(211, 47, 47);border-bottom: 3px solid rgb(211, 47, 47);font-size: larger;font-weight: bold;text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;'";
                    break;
                case rating < 1:
                    stylingElement =
                        "style='width: 50px;background-color: rgb(183, 28, 28);display: flex;justify-content: center;border-radius: 10px;border-top: 1px solid rgb(136, 14, 79);border-bottom: 3px solid rgb(136, 14, 79);font-size: larger;font-weight: bold;text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;'";

            }
            let newRating = Number.isInteger(rating) ? rating + ".0" : rating.toString();
            return `<td ${stylingElement}><a style='color: white !important;' href=https://www.ratemyprofessors.com/professor/${id}>${newRating}</a></td>`;
        } catch (error) {
            console.error('Error fetching professor data:', error);
            return null;
        }
    }

    async function run() {
        let iframe = null;
        let attempts = 0;
        const maxAttempts = 30;

        while (iframe === null && attempts < maxAttempts) {
            iframe = document.getElementById("ptModFrame_0");
            if (!iframe) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }

        if (iframe === null) {
            iframe = document.getElementById("ptifrmtgtframe");
            console.log(iframe)
            if (!iframe) return;
        }

        const innerDoc = iframe.contentDocument;


        // Check if innerDoc is loaded and retry if necessary
        if (!innerDoc || !innerDoc.body || innerDoc.body.innerHTML === "" || innerDoc.readyState !== "complete") {
            console.log("Inner document not fully loaded yet. Retrying in 100ms...");
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log(iframe)

        let numberOfResults;
        do {
            numberOfResults = innerDoc.getElementsByClassName("PSGROUPBOXLABEL")[0]?.innerText.replace(/\D/g, "");
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms before trying again
        } while (numberOfResults === undefined);

        console.log("number of results: " + numberOfResults);

        for (let index = 0; index < numberOfResults; index++) {
            const instructorSpan = innerDoc.getElementById(`MTG_INSTR$${index}`);

            if (instructorSpan) {
                // console.log("Instructor span found:", instructorSpan);

                let name = instructorSpan.innerText.trim();
                // console.log("Instructor name:", name);

                if (!name.includes(",")) {
                    try {
                        const html = await generateProfRating(name);
                        // console.log("Generated HTML:", html);
                        if (html !== null) {
                            $(instructorSpan).after(html);
                            // console.log("HTML inserted after instructor span.");
                        }
                    } catch (error) {
                        console.error('Error generating professor rating:', error);
                    }
                }
            } else {
                //console.log("// TODO implement later, course contains 2+ instructors.", index);
            }
        }
    }


    let lastResultCount = null;
    let isRunning = false;

    function checkAndRun() {
        let iframe = document.getElementById("ptModFrame_0");
        if (!iframe) {
            iframe = document.getElementById("ptifrmtgtframe");
            if (!iframe) return;
        }


        let innerDoc = iframe.contentDocument || iframe.contentWindow.document;
        let resultElement = innerDoc.getElementsByClassName("PSGROUPBOXLABEL")[0];
        if (!resultElement) return;

        let currentResultCount = resultElement.innerText.replace(/\D/g, "");
        console.log("Current result count:", currentResultCount);
        if (currentResultCount !== lastResultCount && !isRunning) {
            isRunning = true;
            lastResultCount = currentResultCount;

            console.log("Search results changed. Running code...");
            run().catch(console.error).finally(() => {
                isRunning = false;
                console.log("Code execution completed.");
            });
        }
    }

    // Run the check every 500ms
    setInterval(checkAndRun, 500);
