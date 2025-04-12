export function appendPopUp(html: string[]) : HTMLElement{

    let span = document.createElement("span")
    let wrapper= document.createElement("div")
    wrapper.innerHTML= html[0];
    let newWrap = wrapper

    

    let parse = parseInt(html[2])

    span.innerHTML = "Difficulty: " + html[1] + ", Would Take Again: " + Math.round(parse) + "%"
    span.style.setProperty("visibility", "hidden")
    span.style.setProperty("width", "120px")
    span.style.setProperty("background-color", "gray")
    span.style.setProperty("color", "#fff")
    span.style.setProperty("text-align", "center")
    span.style.setProperty("border-radius", "6px")
    span.style.setProperty("padding", "#5px 0")
    span.style.setProperty("position", "absolute")
    span.style.setProperty("z-index", "1")
    newWrap!.addEventListener('mouseover', () => {
        span.style.visibility = 'visible';
        });
    newWrap!.addEventListener('mouseout', () => {
    span.style.visibility = 'hidden';
    });
    newWrap!.appendChild(span)

    return newWrap
}