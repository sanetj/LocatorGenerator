let detectedElements = [];
function detectRole(element){

    let tag = element.tagName.toLowerCase();

    // BUTTONS
    if(tag === "button") return "button";

    // LINKS
    if(tag === "a") return "link";

    // IMAGES
    if(tag === "img") return "img";

    // SELECT DROPDOWN
    if(tag === "select") return "combobox";

    // TEXTAREA
    if(tag === "textarea") return "textbox";

    // LISTS
    if(tag === "ul" || tag === "ol") return "list";

    if(tag === "li") return "listitem";

    // TABLES
    if(tag === "table") return "table";

    if(tag === "tr") return "row";

    if(tag === "td") return "cell";

    if(tag === "th") return "columnheader";

    // FORM
    if(tag === "form") return "form";

    // INPUT TYPES
    if(tag === "input"){

        let type = element.getAttribute("type") || "text";

        if(type === "submit" || type === "button" || type === "reset")
            return "button";

        if(type === "checkbox")
            return "checkbox";

        if(type === "radio")
            return "radio";

        if(type === "range")
            return "slider";

        if(type === "number")
            return "spinbutton";

        if(type === "search")
            return "searchbox";

        if(type === "email" || type === "tel" || type === "url" || type === "password" || type === "text")
            return "textbox";

        return "textbox";
    }

    return null;
}

function scoreToStars(score){

    let stars = Math.round(score / 20);

    if(stars > 5){
        stars = 5;
    }

    let result = "";

    for(let i=0;i<stars;i++){
        result += "⭐";
    }

    for(let i=stars;i<5;i++){
        result += "☆";
    }

    return result;
}


function getAccessibleName(element, doc){

    // aria-labelledby
    let labelledby = element.getAttribute("aria-labelledby");

    if(labelledby){
        let ids = labelledby.split(" ");
        let text = "";

        ids.forEach(id=>{
            let ref = doc.getElementById(id);
            if(ref){
                text += ref.textContent.trim() + " ";
            }
        });

        if(text.trim()) return text.trim();
    }

    // aria-label
    let ariaLabel = element.getAttribute("aria-label");
    if(ariaLabel){
        return ariaLabel.trim();
    }

    // label association
    if(element.id){
        let label = doc.querySelector(`label[for="${element.id}"]`);
        if(label){
            return label.textContent.trim();
        }
    }

    // wrapped label
    let parent = element.parentElement;
    if(parent && parent.tagName.toLowerCase() === "label"){
        return parent.textContent.trim();
    }

    // alt text
    let alt = element.getAttribute("alt");
    if(alt){
        return alt.trim();
    }

    // title
    let title = element.getAttribute("title");
    if(title){
        return title.trim();
    }

    // value (inputs)
    let value = element.getAttribute("value");
    if(value){
        return value.trim();
    }

    // text content
    if(element.textContent){
        return element.textContent.trim();
    }

    return "";
}

function detectElements(doc){

    let elements = doc.querySelectorAll(
        "input, button, textarea, select, a, img"
    );

    detectedElements = elements;

    let selector = document.getElementById("elementSelector");

    selector.innerHTML = "";

    elements.forEach((el,index)=>{

        let tag = el.tagName.toLowerCase();

        let label =
            el.id ||
            el.textContent.trim() ||
            el.getAttribute("placeholder") ||
            el.getAttribute("aria-label") ||
            tag;

        let option = document.createElement("option");

        option.value = index;
        option.textContent = `${index+1}. ${tag} → ${label}`;

        selector.appendChild(option);

    });

}
function parseHTML(){

    let html = document.getElementById("htmlInput").value.replace(/,/g,"");

    let parser = new DOMParser();
    let doc = parser.parseFromString(html, "text/html");

    detectElements(doc);


}

function copyLocator(btn){

    let locator = btn.getAttribute("data-locator");

    navigator.clipboard.writeText(locator);

}

function generateLocator() {

    let html = document.getElementById("htmlInput").value;

    let parser = new DOMParser();
    let doc = parser.parseFromString(html, "text/html");
//

   let index = parseInt(document.getElementById("elementSelector").value);

let element = detectedElements[index];

// if the first element is a label, try to find the associated control
if(element && element.tagName.toLowerCase() === "label"){

    let forId = element.getAttribute("for");

    if(forId){

        let control = doc.getElementById(forId);

        if(control){
            element = control;
        }

    } else {

        let nested = element.querySelector("input, textarea, select");

        if(nested){
            element = nested;
        }

    }
}

    if(!element){
        document.getElementById("result").innerText = "No element found";
        return;
    }

    let locators = [];

    function addLocator(type, value, score){
        locators.push({type,value,score});
    }

    let role = detectRole(element);

   let text = getAccessibleName(element, doc);

    // LABEL BASED LOCATOR

    let labelText = null;

    // case 1: label with "for"
    if(element.tagName.toLowerCase() === "input" && element.id){

        let labelElement = doc.querySelector(`label[for="${element.id}"]`);

        if(labelElement){
            labelText = labelElement.textContent.trim();
        }
    }

    // case 2: input wrapped inside label
    let parent = element.parentElement;

    if(!labelText && parent && parent.tagName.toLowerCase() === "label"){
        labelText = parent.textContent.trim();
    }

    if(labelText){

        addLocator(
            "Playwright",
            `page.getByLabel('${labelText}')`,
            95
        );

    }

    // PLAYWRIGHT LOCATORS
    // ROLE BASED LOCATOR (highest priority)

if(role){

    if(text){

        addLocator(
            "Playwright",
            `page.getByRole('${role}', { name: '${text}' })`,
            110
        );

    }
    else{

      addLocator(
    "Playwright",
    `page.getByRole('${role}')`,
    85
);

    }

}

    if(element.getAttribute("data-testid")){
        let v = element.getAttribute("data-testid");
        addLocator("Playwright",`page.getByTestId('${v}')`,100);
    }

    if(element.getAttribute("aria-label")){
        let v = element.getAttribute("aria-label");
        addLocator("Playwright",`page.getByLabel('${v}')`,90);
    }

    if(element.getAttribute("placeholder")){
        let v = element.getAttribute("placeholder");
        addLocator("Playwright",`page.getByPlaceholder('${v}')`,80);
    }

    if(element.getAttribute("alt")){
        let v = element.getAttribute("alt");
        addLocator("Playwright",`page.getByAltText('${v}')`,75);
    }

    if(element.getAttribute("title")){
        let v = element.getAttribute("title");
        addLocator("Playwright",`page.getByTitle('${v}')`,70);
    }

    if(element.textContent && element.textContent.trim().length>0){
        let v = element.textContent.trim();
        addLocator("Playwright",`page.getByText('${v}')`,65);
    }

    if(element.id){
        let v = element.id;
        addLocator("CSS",`#${v}`,60);
        addLocator("XPath",`//*[@id='${v}']`,60);
    }

    if(element.className){
        let v = element.className;
        addLocator("CSS",`${element.tagName.toLowerCase()}.${v.split(" ").join(".")}`,40);
    }
    
    if(element.getAttribute("type")){

    let type = element.getAttribute("type");

    addLocator(
        "CSS",
        `${element.tagName.toLowerCase()}[type='${type}']`,
        30
    );

    addLocator(
        "XPath",
        `//${element.tagName.toLowerCase()}[@type='${type}']`,
        30
    );

}
    addLocator("CSS",element.tagName.toLowerCase(),10);
    addLocator("XPath","//"+element.tagName.toLowerCase(),10);

    // sort locators
    locators.sort((a,b)=>b.score-a.score);

    let result = "";
    locators.forEach((l,index)=>{

    let stars = scoreToStars(l.score);
    let label = index === 0 ? "⭐ BEST → " : "";

    result += `<div>
${label}${l.type}: ${l.value}   ${stars}
<button data-locator="${l.value}" onclick="copyLocator(this)">Copy</button>
</div>`;

});

   document.getElementById("result").innerHTML = result;
}

// ADD NEW FUNCTION BELOW THIS LINE


function getBestPlaywrightLocator(element, doc){

    let role = detectRole(element);
    let text = getAccessibleName(element, doc);

    // ROLE BASED LOCATOR (BEST)
    if(role && text){
        return `page.getByRole('${role}', { name: '${text}' })`;
    }

    // LABEL
    if(element.id){
        let label = doc.querySelector(`label[for="${element.id}"]`);
        if(label){
            let labelText = label.textContent.trim();
            return `page.getByLabel('${labelText}')`;
        }
    }

    // PLACEHOLDER
    if(element.getAttribute("placeholder")){
        let v = element.getAttribute("placeholder");
        return `page.getByPlaceholder('${v}')`;
    }

    // ALT
    if(element.getAttribute("alt")){
        let v = element.getAttribute("alt");
        return `page.getByAltText('${v}')`;
    }

    // TEXT
    if(element.textContent && element.textContent.trim()){
        let v = element.textContent.trim();
        return `page.getByText('${v}')`;
    }

    // FALLBACK
    if(element.id){
        return `page.locator('#${element.id}')`;
    }

    return `page.locator('${element.tagName.toLowerCase()}')`;
}

function toCamelCase(text){

    return text
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g,"")
        .split(" ")
        .map((word,index)=>
            index===0
            ? word
            : word.charAt(0).toUpperCase()+word.slice(1)
        )
        .join("");
}

function handlePaste(event){

    event.preventDefault();

    let paste = (event.clipboardData || window.clipboardData).getData('text');

    let textarea = document.getElementById("htmlInput");

    let current = textarea.value.trim();

    if(current.length === 0){
        textarea.value = paste;
parseHTML();
    }
    else{
        textarea.value = current + ",\n" + paste;
parseHTML();
    }

}


function generatePOM(){

    let usedNames = {};
    let html = document.getElementById("htmlInput").value;

    if(!html){
        document.getElementById("result").innerText = "Paste HTML first";
        return;
    }

    let parts = html.split(",");

    let elements = [];

    parts.forEach(part => {

        let parser = new DOMParser();
        let doc = parser.parseFromString(part.trim(), "text/html");

        let found = doc.querySelectorAll(
    "input, button, textarea, select, a, img"
);

found.forEach(el => {

    if(el.closest("script")){
        return;
    }

    elements.push(el);
});

    });

    let pom = `
import { Page } from '@playwright/test';

export class GeneratedPage {

  readonly page: Page;
`;

    elements.forEach(el => {

        let tag = el.tagName.toLowerCase();

        if(!["input","button","textarea","select","a","img"].includes(tag)){
            return;
        }

        let name =
            el.id ||
            el.getAttribute("name") ||
            el.getAttribute("placeholder") ||
            el.getAttribute("alt") ||
            el.getAttribute("title") ||
            getAccessibleName(el, document) ||
            tag;

        name = toCamelCase(name);

        if(usedNames[name]){
            usedNames[name]++;
            name = name + usedNames[name];
        }
        else{
            usedNames[name] = 1;
        }

        let locator = getBestPlaywrightLocator(el, document);

        pom += `
  readonly ${name} = ${locator};
`;

    });

    pom += `

  constructor(page: Page){
    this.page = page;
  }

}
`;

    document.getElementById("result").innerText = pom;

}