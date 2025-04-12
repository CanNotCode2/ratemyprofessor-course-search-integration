import {checkNameMatch, searchProfessor} from './professor_data_utils.ts';
import {log} from "../../logger.ts";

const schoolID = 1232;
const schoolNameWebEncoded = 'The%20University%20of%20North%20Carolina%20at%20Chapel%20Hill';

export async function generateProfRating(professorsInput: string): Promise<(string)[][] | null> {
        // Split the input string by comma, newline, or multiple whitespace
        // and filter out empty strings
        const professorNames = professorsInput
            .split(/[\n,]+|\s{2,}/) // Split by comma, newline, or multiple whitespace
            .map(name => name.trim()) // Trim whitespace from each name
            .filter(name => name.length > 0 && name != "-" && name != "-None"); // Remove empty entries

        // Process each professor name and collect results
        return await Promise.all(
            professorNames.map(async (fullName) => {
                let result;
                try {
                    result = await searchProfessor(fullName, schoolID, schoolNameWebEncoded);
                } catch (error) {
                    log.error('Error fetching professor data:', error);
                    let str = createRatingCell(
                        'Search',
                        `https://www.ratemyprofessors.com/search/professors/${schoolID}?q=${fullName}`,
                        defaultStyle(true)
                    );

                    return [str, 0, "N/A"]
                }

                if (result.numRatings === 0 || !checkNameMatch(result.name, fullName)) {
                    let str = createRatingCell(
                        'Search',
                        `https://www.ratemyprofessors.com/search/professors/${schoolID}?q=${fullName}`,
                        defaultStyle(false)
                    );

                    return [str, 0, "N/A"]
                }

                const rating = result.avgRating;
                const difficulty = result.avgDifficulty;
                const wouldTakeAgainPercent = result.wouldTakeAgainPercent;
                const id = result.id;
                const formattedRating = Number.isInteger(rating) ? rating + '.0' : rating.toString();
                const colorStyle = getRatingStyle(rating);

                let str =  createRatingCell(
                    formattedRating,
                    `https://www.ratemyprofessors.com/professor/${id}`,
                    colorStyle
                );
                return [str, difficulty, wouldTakeAgainPercent]
            })
        );
}

function createRatingCell(content: string, href: string, specificClass: string): string {
  return `
    <div class="registron-rating-cell ${specificClass}">
      <a href="${href}">${content}</a>
    </div>
  `.trim();
}

function defaultStyle(error: boolean): string {
    return error ? 'registron-rating-error' : 'registron-rating-search';
}

function getRatingStyle(rating: number): string {
    if (rating >= 4) return "registron-rating-good";
    if (rating >= 3) return "registron-rating-average";
    if (rating >= 2) return "registron-rating-okay";
    if (rating >= 1) return "registron-rating-poor";
    return "registron-rating-awful";
}


// Function to inject CSS into a document's head
export async function injectCSS(doc: Document, css = `
  .registron-rating-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5em;
  padding: 0.25em 0.5em;    
  margin: 0.125em;          
  font-size: 0.875rem;     
  font-weight: 600;
  border-radius: 0.25em;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.registron-rating-cell a {
  display: block;
  width: 100%;
  color: inherit !important;
  text-decoration: none;
}

.registron-rating-cell:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

.registron-rating-cell:focus-within {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
  .registron-rating-good { background-color: rgb(44, 193, 226); }
  .registron-rating-average { background-color: rgb(76, 175, 80); }
  .registron-rating-okay { background-color: rgb(255, 235, 59); }
  .registron-rating-poor { background-color: rgb(255, 152, 0); }
  .registron-rating-awful { background-color: rgb(223, 24, 24); }
  .registron-rating-search { background-color: rgb(167, 170, 173); }
  .registron-rating-error { background-color: rgb(204, 0, 0); }
  .registron-rating-average a, .registron-rating-okay a { color: black !important; }
  .registron-rating-cell a:hover { opacity: 0.85; }
`, styleId: string) {
    if (doc.getElementById(styleId)) {
        return;
    }
    const styleElement = doc.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = css;
    doc.head.appendChild(styleElement);
}

