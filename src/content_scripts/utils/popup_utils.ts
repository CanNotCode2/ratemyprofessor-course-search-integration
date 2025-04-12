export function appendPopUp(html: string[]) : HTMLElement{

    let span = document.createElement("span")
    let wrapper= document.createElement("div")
    wrapper.innerHTML= html[0];
    let newWrap = wrapper

    

    let parse = parseInt(html[2])

    span.innerHTML = "Difficulty: " + html[1] + ", Would Take Again: " + Math.round(parse) + "%"
    span.style = "visibility: hidden; width: 120px; background-color: gray; color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 1;"
    newWrap!.addEventListener('mouseover', () => {
        span.style.visibility = 'visible';
        });
    newWrap!.addEventListener('mouseout', () => {
    span.style.visibility = 'hidden';
    });
    newWrap!.appendChild(span)

    return newWrap
}