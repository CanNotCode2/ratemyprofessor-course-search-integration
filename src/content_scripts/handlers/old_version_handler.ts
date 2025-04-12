import { generateProfRating } from '../utils/rmp_utils.ts';
import { getIframeDocument, waitForElement } from '../utils/dom_utils.ts';
import $ from "jquery";
import {injectCSS} from "../utils/rmp_utils.ts";
import { appendPopUp } from '../utils/popup_utils.ts';


export async function handleOldSite() {
    const iframeDoc = getIframeDocument();
    if (!iframeDoc) return;

    injectCSS(iframeDoc, undefined, 'registron-rating-styles'); 

    const label = await waitForElement(() =>
        iframeDoc.getElementsByClassName("PSGROUPBOXLABEL")[0]
    );

    const numResults = parseInt(label.innerText.replace(/\D/g, ""), 10);

    for (let i = 0; i < numResults; i++) {
        const instructorSpan = iframeDoc.getElementById(`MTG_INSTR$${i}`);
        if (instructorSpan === null || instructorSpan.hasAttribute("data-registron-injected")) continue

        instructorSpan.setAttribute("data-registron-injected", "true");
        const professorNames = instructorSpan.innerText.trim();
        console.log(professorNames)
        const htmls = await generateProfRating(professorNames)
        if (htmls === null || htmls.length < 1) continue;
        htmls.forEach((html) => {
            let newWrap = appendPopUp(html)
            if (html) $(instructorSpan).after(newWrap);
        })


        /*
            if (!name.includes(",")) {
                console.log(name)
                const htm = await generateProfRating(name);
                let html = htm[0]

                

                var wrapper= document.createElement("div")
                wrapper.innerHTML= html!;
                let wrap = wrapper.firstElementChild
                

                let newWrap = wrapper

                let span = document.createElement("span")
                span.innerHTML = "Difficulty: " + htm[1] + ", Would Take Again: " + htm[2] + "%"
                span.style = "visibility: hidden; width: 120px; background-color: gray; color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 1;"
                newWrap!.addEventListener('mouseover', () => {
                    span.style.visibility = 'visible';
                  });
                newWrap!.addEventListener('mouseout', () => {
                span.style.visibility = 'hidden';
                });
                newWrap!.appendChild(span)


                if (html) $(instructorSpan).after(newWrap);


                
            }
        }


        */
    }
}