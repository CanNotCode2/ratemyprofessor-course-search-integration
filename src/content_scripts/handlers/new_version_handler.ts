import {waitForElement} from '../utils/dom_utils.ts';
import {log} from "../../logger.ts";
import {generateProfRating, injectCSS} from "../utils/rmp_utils.ts";
import { appendPopUp } from '../utils/popup_utils.ts';

export async function handleNewSite() {
    let iframeDoc: Document;
    let wrapper: HTMLElement;

    await waitForElement((): boolean => {
        const iframe = document.getElementById("main_iframe") as HTMLIFrameElement;

        if (iframe && iframe.contentDocument) {
            iframeDoc = iframe.contentDocument;
            if (iframeDoc) {
                injectCSS(iframeDoc, undefined, 'registron-rating-styles');
            }            
            const el = iframeDoc.querySelector(".cx-MuiTypography-root.cx-MuiTypography-h2.cx-MuiTypography-colorTextPrimary");
            log.verbose("Found in iframe:", el?.textContent);
            if (el == null || el.textContent !== "Class Search") return false;

            // Check if the wrapper object which contains all the class data for the search as its children exists
            // Note that this object can exist on other pages as well but for it won't if the page name is "Class Search"
            wrapper = iframeDoc.querySelector(".cx-MuiGrid-root.cx-MuiGrid-container.cx-MuiGrid-spacing-xs-1.cx-MuiGrid-direction-xs-column") as HTMLElement;
            if (!wrapper) return false;
            // Page is initially empty until the user searches for classes
            // When a user searches for classes a new element is added to the wrapper as a child making the length 3 -> 4
            if (wrapper.children.length < 4) return false;
        }
        return true;
    }).then(async () => {
        log.verbose("✅ Conditions met: on 'Class Search' page and wrapper exists.");

        const thirdChild: Element | null = wrapper.children[2] ?? null;
        if (!thirdChild || thirdChild.children.length !== 1) {
            log.warn("Fourth child missing or doesn't have exactly one child.");
            return;
        }

        const classGroupContainer: Element = thirdChild.firstChild as Element;

        for (const classType of Array.from(classGroupContainer.children)) {
            const classTypeChildren = Array.from(classType.children);
            const sectionsContainer: Element | undefined = classTypeChildren[1];
            if (!sectionsContainer) continue;

            for (const section of Array.from(sectionsContainer.children)) {
                try {
                    // Traverse: section > div > div
                    const mobileDiv: Element = section.querySelector("div > div > div:nth-child(2) > dl:nth-child(4)") as Element;
                    if (mobileDiv !== null) {
                        const sourceElement: Element | null = mobileDiv.firstChild as Element;
                        if (!sourceElement) {
                            log.warn("Source element to clone not found.");
                            continue;
                        }

                        // Strip "Instructor:" prefix from element textContent
                        const instructorNameString = (mobileDiv.children[4].textContent as string).substring(11);

                        // Check if we've already injected ratings for this section
                        const lastChild: HTMLElement = mobileDiv.children[mobileDiv.children.length - 1] as HTMLElement;
                        if (lastChild.hasAttribute("data-registron-injected")) {
                            log.verbose("Skipping section: already injected.");
                            continue;
                        }
                        lastChild.setAttribute("data-registron-injected", "true");

                        // Generate ratings for all professors (single or multiple)
                        const ratingElements = await generateProfRating(instructorNameString);
                        if (ratingElements !== null && ratingElements.length > 0) {
                            let newNode: HTMLElement = lastChild.cloneNode(true) as HTMLElement;
                            // @ts-ignore
                            newNode.firstChild.childNodes[0].textContent = "Ratings:"
                            // @ts-ignore
                            let secondColumnTableEntry = newNode.firstChild.childNodes[1].firstChild.firstChild;
                            if (secondColumnTableEntry === null) return;
                            secondColumnTableEntry.removeChild(secondColumnTableEntry.childNodes[0]);

                            // Create a container for the rating boxes to place them side by side
                            const ratingsContainer = iframeDoc.createElement("div");
                            ratingsContainer.style.display = "flex"; // Use flexbox for side-by-side layout
                            ratingsContainer.style.gap = "5px"; // Add some spacing between rating boxes
                            ratingsContainer.setAttribute("data-registron-injected", "true");

                            // Append each rating element to the container
                            ratingElements.forEach((ratingHtml) => {
                                let newTag = appendPopUp(ratingHtml)
                                ratingsContainer.appendChild(newTag); // Append the <td> element
                            });

                            // Inject the container after the last child
                            secondColumnTableEntry.appendChild(ratingsContainer)
                            mobileDiv.appendChild(newNode);
                            log.verbose("✅ Injected rating elements into section.");
                            continue;
                        }
                    }

                    const temp: Element = section.lastChild as Element;
                    const widescreenDiv = temp.querySelector("div > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > div")
                    if (widescreenDiv !== null && !widescreenDiv.hasAttribute("data-registron-injected")) {
                        widescreenDiv.setAttribute("data-registron-injected", "true");
                        const instructorNameString: string = (temp.querySelector("div > div:nth-child(1) > div > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(5)") as Element).textContent as string;
                        const bufferDiv = widescreenDiv.children[1].cloneNode(true) as HTMLElement;
                        const ratingElements = await generateProfRating(instructorNameString);
                        if (ratingElements !== null && ratingElements.length > 0) {
                            ratingElements.forEach((ratingHtml) => {
                                widescreenDiv.appendChild(bufferDiv);
                                let popUp = appendPopUp(ratingHtml)
                                widescreenDiv.appendChild(popUp);
                            })
                        }
                    }

                } catch (e) {
                    log.error("❌ Error while injecting element:", e);
                }
            }
        }
    }).catch(() => {
        log.verbose("❌ Promise rejected: conditions not met.");
    });
}