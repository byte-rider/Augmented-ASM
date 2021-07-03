// ==UserScript==
// @name         Augmented-ASM
// @namespace    augmented-asm
// @version      1.50
// @description  modify cosmetic elements of ASM to be more productive
// @author       George (edw19b)
// @match        https://servicecentre.csiro.au/Production/core.aspx
// @run-at       document-end
// @updateURL    https://github.com/george-edwards-code/Augmented-ASM/raw/master/Augmented-ASM.user.js
// @downloadURL  https://github.com/george-edwards-code/Augmented-ASM/raw/master/Augmented-ASM.user.js
// @resource     DARK_MODE_CSS https://raw.githubusercontent.com/george-edwards-code/Augmented-ASM/master/dark-mode.css
// @connect      samsara-nc
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

// debugger;

const AASMVERSION = "1.50";

/* Stylings for anything added to the page
   (controls, buttons etc.) */
const cssControls = `
@import url('https://fonts.googleapis.com/css2?family=Caveat&display=swap');

#aasm_controls, #aasm_controls-2 {
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

#aasm_controls-2 {
  display: none;
}

#btn-update {
  display: none;
}

.aasm-button {
	padding: 0.35rem 2rem 0.2rem 2rem;
	margin-right: 1rem;
	border-radius: 0.4rem;
	text-align: center;
	transition: all 0.2s;
	font-family: "Lucida Console", "Courier New", monospace;
	font-size: 1.2rem;
	text-transform: uppercase;
    border: 2px solid grey;
    background: none;
}

.aasm-button:hover {
  color: white;
  background-color: grey;
}

.aasm-button-active {
  background-color: #c8c8c8;
  color: #4d4d4d;
}

#colour-picker {
    margin-right: 1rem;
}

.aasm-flex-item {
  display: flex;
  margin: 0.25rem 0 0.25rem 1rem;
}

#aasm_controls .slider {
  width: 27rem;
}

#aasm_controls .slider-label {
	text-align: center;
	padding-left: 1rem;
    padding-top: 0.3rem;
	font-size: 1.2rem;
	letter-spacing: 0.3rem;
	font-family: "Lucida Console", "Courier New", monospace;
}

.aasmwatermark {
    position: absolute;
    left: 44rem;
    top: 4.3rem;
    font-size: 3.5rem;
    opacity: 0.2;
    font-family: 'Caveat', cursive;
}

`;


(function () {
    'use strict';

    // HTML SCAFFOLDING - CONTROLS
    // NOTE: div's where one might put <label> or <span>
    // this is to avoid unwanted CSS
    document.getElementById("AlembaToolbar").innerHTML += `
    <div id="aasm_controls">
      <div class="aasm-flex-item">
        <button id="btn-hide" class="aasm-button">hide</button>
        <button id="btn-augment" class="aasm-button">augment</button>
        <button id="btn-dark-mode" class="aasm-button">dark</button>
        <input id="colour-picker" type="color" value="#29002E">
        <button id="btn-default" class="aasm-button">default</button>
        <button id="btn-about" class="aasm-button">about</button>
        <button id="btn-update" class="aasm-button">update</button>
      </div>
      <div class="aasm-flex-item">
        <input id="slider-contents" class="slider" type="range" min="1.0" max="2.0" step="0.05">
        <div class="slider-label">tab-contents</div>
      </div>
      <div class="aasm-flex-item">
        <input id="slider-maxwidth" class="slider" type="range" min="0" max="1.0" step="0.025">
        <div class="slider-label">tab-maxwidth</div>
      </div>
      <div class="aasm-flex-item">
        <input id="slider-description" class="slider" type="range" min="1.3" max="7.0" step="0.05">
        <div class="slider-label">description</div>
        <div class="aasmwatermark">Augmented-ASM v${AASMVERSION}</div>
      </div>
    </div>
    <div id="aasm_controls-2">
      <div class="aasm-flex-item">
        <button id="btn-show" class="aasm-button">show</button>
      </div>
    </div>
    `;

    // INJECT AASM-CSS
    let styleElementAASM = document.createElement('style');
    styleElementAASM.innerHTML = cssControls;
    (document.head || document.documentElement).appendChild(styleElementAASM);

    // INJECT ANIMATION CSS LIBRARY (https://animate.style/)
    let animate = document.createElement('link');
    animate.type = "text/css";
    animate.rel = 'stylesheet';
    animate.href = "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css";
    document.head.appendChild(animate);

    // BUTTON HIDE
    document.querySelector("#aasm_controls #btn-hide").addEventListener("click", hide);

    function hide() {
        document.querySelector("#aasm_controls").style.display = "none";
        document.querySelector("#aasm_controls-2").style.display = "flex";
    }

    // BUTTON SHOW
    document.querySelector("#aasm_controls-2 #btn-show").addEventListener("click", show);

    function show() {
        document.querySelector("#aasm_controls").style.display = "flex";
        document.querySelector("#aasm_controls-2").style.display = "none";
    }


    // BUTTON AUGMENT
    let augment_flag = false;
    document.querySelector("#btn-augment").addEventListener("click", augment);
    function augment() {
        let btn = document.querySelector("#btn-augment");
       // turn augments on
        if (!augment_flag) {
            //wastedSpace(true);
            navbarFix(true);
            readability_mode(true);
            try {
            } catch {null}
        }

        // turn augments off
        if (augment_flag) {
            //wastedSpace(false);
            navbarFix(false);
            readability_mode(false);
            try {
            } catch {null}
        }

        // change button accordingly
        (augment_flag) ? btn.classList.remove("aasm-button-active"): btn.classList.add("aasm-button-active");

        // toggle flag
        augment_flag = ~augment_flag;
    };

    // Turn on initially
    augment();

    // ---------------------------
    //            DARK MODE
    // -------------------------------------------------------------
    let dark_mode_flag = false;
    let semaphore = true; // used in async calls when sending css <link> down end of <head> in the dom to avoid flickering
    let interval = 500; // milliseconds to wait before sending css <link> down end of <head> in the dom to avoid flickering
    let darkModeTintStyle = document.createElement('style');
    darkModeTintStyle.id = "dark_mode_tint";
    darkModeTintStyle.innerHTML = `:root {--tint: ${document.getElementById("colour-picker").value};}`;

    let dark_mode_raw_css = GM_getResourceText("DARK_MODE_CSS");
    let darkModeElement = GM_addStyle(dark_mode_raw_css);
    darkModeElement.id = "dark_mode";
    document.getElementById("dark_mode").remove();

    document.querySelector("#btn-dark-mode").addEventListener("click", _dark_mode);
    function _dark_mode(event) {
        dark_mode_flag = ~dark_mode_flag;
        // style the button that was just pressed
        (dark_mode_flag) ? document.getElementById("btn-dark-mode").classList.add("aasm-button-active") : document.getElementById("btn-dark-mode").classList.remove("aasm-button-active");
        // change Alemba's banner; they have it styled on the Element itself for some reason meaning no stylesheet could change it
        (dark_mode_flag) ? document.querySelector("nav").style = "" : document.querySelector("nav").style = `background-image: linear-gradient(rgb(206, 217, 233), rgb(244, 246, 251)) !important;`;
        // add/remove the dark mode CSS
        (dark_mode_flag) ? modify_all_documents(window.top.frames, add_stylesheet, darkModeElement) : modify_all_documents(window.top.frames, remove_stylesheet, darkModeElement)
        // add/remove the dark mode tint
        // (dark_mode_flag) ? modify_all_documents(window.top.frames, add_stylesheet, darkModeTintStyle) : modify_all_documents(window.top.frames, remove_stylesheet, darkModeTintStyle)
        // NOTE: for some reason the above code falls over when the flag is fale, i.e., when removing the <style> element.
        // Alemba's jQuery catches the error and the following is it's value on the stack:
        //    Uncaught TypeError: modify_all_documents(...) is not a function.
        // The reason for this error is beyond my knowledge, every other call to that function has it execute.
        // Because of this the <style> will simply remain in the dom; there's no harm there because it's just
        // one line of CSS. A line containing a colour variable called --tint which is never used by Alemba, it looks like this:
        //    :root {--tint: #123456;}
        if (dark_mode_flag) {
            modify_all_documents(window.top.frames, add_stylesheet, darkModeTintStyle)
        }
    }
    
    /* colour picker's oninput:
        record the new colour as a CSS variable called: --tint.
        Then remove and re-add the "tint" <syle> element from the DOM ...but only if the user has dark mode on.
    */
    document.querySelector("#colour-picker").addEventListener("input", (event) => {
        darkModeTintStyle.innerHTML = `:root {--tint: ${event.target.value};}`;
        if (dark_mode_flag) {
            modify_all_documents(window.top.frames, remove_stylesheet, darkModeTintStyle);
            modify_all_documents(window.top.frames, add_stylesheet, darkModeTintStyle);
        }
    });

    /* cascade_dark_mode(document, element)
    sends dark mode's <style> element to the end of <head>
    */
    function cascade_dark_mode(doc, darkModeElement) {
        if (semaphore && doc.getElementById(`${darkModeElement.id}`).nextSibling != null) {
            semaphore = false;
            setTimeout(() => {
                semaphore = true;
                doc.head.appendChild(doc.getElementById(`${darkModeElement.id}`)); // appendChild will move the element, i.e., remove then read at the end.
            }, interval);
        }
    }

    function remove_stylesheet(doc, element) {
        if (doc.contains(doc.getElementById(`${element.id}`))) {
            doc.getElementById(`${element.id}`).remove();
        }
    }

    /* add_stylesheet(document, element)
    Adds <style> element to the document's <head> as its second-last child. Like this:
    document
        <html>
            <head>
                <link>
                ...
                <style>  <-- element inserted here
                <style>  
            </head>
            ...
        </html>
        
    Unless head is empty, in which case it's inserted as its only child:
    document
        <html>
            <head>
                <style>  <-- element inserted here
            </head>
            ...
        </html>
    The reason for inserting as second-last child is to stop flickering when the user
    changes the "tint" colour in dark-mode, because if the <style> containing the new tint
    was inserted AFTER the <style> for dark-mode's css the screen flickers; the C in CSS stands
    for cascade after all.
    */
    function add_stylesheet(doc, element) {
        // only add element if it's not already there
        if (!doc.contains(doc.getElementById(`${element.id}`))) {
            if (element.children.length === 0) {
                doc.head.append(element.cloneNode(true));
            } else {
                doc.head.lastElementChild.insertAdjacentElement('beforebegin', element.cloneNode(true));
            }
        }
    }

    /* modify_all_documents(frames, callback, element)
    Alemba have iframes all over the place. This function crawls through the dom,
    passing each iframe's document into the callback function (second parameter).
    The first argument should be 'window.top.frames' to cover entire dom, else
    window.frames to start traversing the dom from only the current iframe in focus.
    */
    function modify_all_documents(frames, callback, element) {
        // stop recursion if at leaf.
        if (frames.length === 0) {
            return;
        }
        
        // get the very first document
        if (frames === window.top.frames) {
            callback(frames.document, element);
        }

        for (let i = 0; i < frames.length; i++) {
            // get all documents in the nodelist
            callback(frames[i].document, element);
            
            // Douglas Hofstadter, baby
            modify_all_documents(frames[i], callback, element);
        }
    }

    // BUTTON RESET TO DEFAULT
    document.querySelector("#aasm_controls #btn-default").addEventListener("click", () => {
        // toggle buttons if they're on.
        (augment_flag) ? augment(): null;

        // toggle darkmode if it's on
        (dark_mode_flag) ? _dark_mode() : null;

        // reset 1st slider (tab content size)
        slider_contents.value = 1.5;
        let tabs = document.querySelectorAll(".tab");
        let tabs_icon = document.querySelectorAll(".tab-label-image");
        let tabs_text = document.querySelectorAll(".tab-label-text");
        let tabs_close = document.querySelectorAll(".tab-label-close");
        for (let i = 0; i < tabs.length; i++) {
            tabs_icon[i].style.width = "16px";
            tabs_icon[i].style.height = "16px";
            tabs_text[i].style.fontSize = "inherit";
            tabs_text[i].style.marginLeft = "20px";
            tabs_text[i].style.marginRight = "25px";
            tabs_close[i].style.width = "16px";
            tabs_close[i].style.height = "16px";
        }

        // reset 2nd slider (tab width)
        slider_maxwidth.value = 0.5;
        for (let i = 0; i < tabs_text.length; i++) {
            tabs_text[i].style.maxWidth = "200px";
        }

        // reset third slider (description)
        slider_description.value = 1;
        adjust_row_height();
    });

    // BUTTON ABOUT
    document.querySelector("#aasm_controls #btn-about").addEventListener("click", aboutAlert);

    function aboutAlert() {
        window.open("https://confluence.csiro.au/display/~edw19b/Augmented-ASM");
    }

    // BUTTON UPDATE
    document.querySelector("#aasm_controls #btn-update").addEventListener("click", update);

    function update() {
        window.open("https://github.com/george-edwards-code/Augmented-ASM/raw/master/Augmented-ASM.user.js");
    }


    // WASTED SPACE
    /*
    function wastedSpace(toggleOn) {
        let e = document.querySelector(".outer-tab-view");
        (toggleOn) ? e.style.marginLeft = "0rem": e.style.marginLeft = "20px";
    }
    */

    // NAVBAR FIX
    function navbarFix(toggleOn) {
        let e = document.querySelector("#AlembaToolbar .navbar-nav");
        (toggleOn) ? e.style.minWidth = "570px": e.style.minWidth = "410px";
    }

    // READABILITY MODE
    // <style> element
    let readability_mode_css = document.createElement('style');
    readability_mode_css.setAttribute("id", "readability_mode_css");
    readability_mode_css.innerHTML = `
    /* Makes fields easier to read */
    .Field[readonly], INPUT[disabled], .Field-Dropdown[disabled]{
    color: black !important;
    border-color: black !important;
    }

    input.form-control[disabled] {
    opacity: 1 !important;
    }

    div[readonlyisreadonly] > label {
        color: inherit;
    }

    input.readonly, .search-control .search-control-input.readonly, .tiered-list-container .input-group > input.form-control, input[id*="TELEPHONE"][readonly] + a.telephon {
    border-color: black !important;
    }


    /* Increase height of list (when forarding a ticket) */
    .Explorer {
    height: 70vh;
    }

    /* Increase height of "Service" popup box */
    .search-control .search-control-output-table {
        max-height: 70vh;
    }

    /* Increase height of "Type" popup box */
    .tiered-list-container .list-container {
        max-height: none;
    }
    `;
    function readability_mode(toggle) {
        // ASM deliver tabbed content through iFrames. We must iterate through them all
        // and append our own <style> tag in each frame, ensuring all tabs are re-styled.
        // This allows us to undo by removing each <style> tag appropriately.
        let iFrames = document.querySelectorAll(".busy-content");
        let iDocument;

        for (let iFrame of iFrames) {
            // Try to grab any open tickets that need styling
            try {iDocument = iFrame.contentWindow.document.querySelector("#Main").contentWindow.document}
            catch { continue; }

            // APPLY
            if (toggle) {
                if (!iDocument.contains(iDocument.getElementById("readability_mode_css"))) {
                    let clone = readability_mode_css.cloneNode(true);
                    iDocument.body.appendChild(clone); // inject <style>
                }
            }

            // REMOVE
            if (!toggle) {
                if (iDocument.contains(iDocument.getElementById("readability_mode_css")))
                    iDocument.getElementById("readability_mode_css").remove(); // remove <style>
                }
        }
    }

    // FIRST SLIDER - (SIZE OF TAB CONTENTS)
    let slider_contents = document.querySelector("#aasm_controls #slider-contents");
    slider_contents.addEventListener("input", adjust_tab_content_size);
    function adjust_tab_content_size() 
    {
        let tabs = document.querySelectorAll(".tab");
        let tabs_icon = document.querySelectorAll(".tab-label-image");
        let tabs_text = document.querySelectorAll(".tab-label-text");
        let tabs_close = document.querySelectorAll(".tab-label-close");
        for (let i = 0; i < tabs.length; i++) {
            tabs_icon[i].style.width = slider_contents.value + "rem";
            tabs_icon[i].style.height = slider_contents.value + "rem";
            tabs_text[i].style.fontSize = slider_contents.value + "rem";
            tabs_text[i].style.marginLeft = slider_contents.value + "rem";
            tabs_text[i].style.marginRight = slider_contents.value + "rem";
            tabs_close[i].style.width = slider_contents.value + "rem";
            tabs_close[i].style.height = slider_contents.value + "rem";
        }
    };

    // SECOND SLIDER - (TAB MAX-WIDTH)
    let slider_maxwidth = document.querySelector("#aasm_controls #slider-maxwidth");
    slider_maxwidth.addEventListener("input", adjust_tab_width)
    function adjust_tab_width()
    {
        let tabs_text = document.querySelectorAll(".tab-label-text");
        let max_width = 50 * slider_maxwidth.value;
        for (let t of tabs_text)
            t.style.maxWidth = `${max_width}rem`;
    }

    // THIRD SLIDER - (DESCRIPTION)
    let slider_description = document.querySelector("#aasm_controls #slider-description");
    slider_description.value = 1.3;
    slider_description.addEventListener("input", adjust_row_height)
    function adjust_row_height()
    {
        // default is 19px
        let asm_iframes = document.querySelectorAll(".busy-content");

        for (let i = 0; i < asm_iframes.length; i++) {
            if (!asm_iframes[i].contentWindow.document.querySelector("[name='Main']").contentWindow.document.getElementById(`description_css${i}`)) {
                // create <style>
                let description_css = document.createElement('style');
                description_css.type = "text/css";
                description_css.setAttribute("id", `description_css${i}`);
                description_css.innerHTML = "";
                asm_iframes[i].contentWindow.document.querySelector("[name='Main']").contentWindow.document.body.appendChild(description_css);
            }

            if (slider_description.value != 1.3) {
                asm_iframes[i].contentWindow.document.querySelector("[name='Main']").contentWindow.document.getElementById(`description_css${i}`).innerHTML = `
                .e-rowcell .string-container {
                    max-height: ${slider_description.value}rem;
                }
                .e-row {
                    outline: 1px solid;
                }`
            } else {
                asm_iframes[i].contentWindow.document.querySelector("[name='Main']").contentWindow.document.getElementById(`description_css${i}`).innerHTML = `
                .e-rowcell .string-container {
                  max-height: ${slider_description.value}rem;
                }
                .e-row {
                    outline: none;
                }`
            }
        }
    }

    // KEYBOARD SNAP TO
    // Snap and Search (magnifying glass)
    function add_finger_and_search_icons() {
        if (!document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#SPAN_IN_OFFICERS_")) {
            return;
        }
        // Insert buttons if not already there
        if (!document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#aasm-searchto")) {

            // create buttons
            let btn1 = document.createElement("div");
            btn1.setAttribute("id", "aasm-snapto");
            btn1.setAttribute("style", "margin-right: 2rem; cursor: pointer;");
            btn1.innerHTML = '👇 snap';

            let btn2 = document.createElement("div");
            btn2.setAttribute("id", "aasm-searchto");
            btn2.setAttribute("style", "margin-right: 2rem; cursor: pointer;");
            btn2.innerHTML = '🔍 find';

            // flex container
            let wrapper = document.createElement("div");
            wrapper.setAttribute("style", "display: flex;");
            wrapper.appendChild(btn1);
            wrapper.appendChild(btn2);

            // insert into dom
            let div = document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector('table tr td div');
            div.parentNode.insertBefore(wrapper, div.nextSibling);

            // add event listeners
            btn1.addEventListener("click", () => keyboard_lookup('snap'));
            btn2.addEventListener("click", () => keyboard_lookup('find'));
        }
    }

    function keyboard_lookup(type) {
        let keypress = prompt(`${type}`, "");
        let activeDocument = document.activeElement.contentWindow.document.activeElement.contentWindow.document
        let cssFoo = ".e-list-item.e-level-1 .e-text-content.e-icon-wrapper img+span div span";
        let cssFooGroups = ".e-list-item.e-level-1 .e-text-content img+span div span";
        let names_listed = null;

        if (activeDocument.querySelector("#SPAN_IN_OFFICERS_").getAttribute("style") != "display: none;")
            names_listed = activeDocument.querySelectorAll(`#SPAN_IN_OFFICERS_ ${cssFoo}`);

        if (activeDocument.querySelector("#SPAN_IN_GROUPS_").getAttribute("style") != "display: none;")
            names_listed = activeDocument.querySelectorAll(`#SPAN_IN_GROUPS_ ${cssFooGroups}`);

        if (activeDocument.querySelector("#SPAN_IN_OFFICERS_BY_GROUP_").getAttribute("style") != "display: none;")
            names_listed = activeDocument.querySelectorAll(`#SPAN_IN_OFFICERS_BY_GROUP_ ${cssFoo}`);

        let simulateClick = function (element) {
            console.log("trying to click")
            let box = element.getBoundingClientRect(),
                coordX = box.left + (box.right - box.left) / 2,
                coordY = box.top + (box.bottom - box.top) / 2;

            element.dispatchEvent(new MouseEvent("mousedown", {
                bubbles: true,
                cancelable: false,
                clientX: coordX,
                clientY: coordY,
                button: 0
            }));
            console.log("mousedown")
            element.dispatchEvent(new MouseEvent("mouseup", {
                bubbles: true,
                cancelable: false,
                clientX: coordX,
                clientY: coordY,
                button: 0
            }));
            console.log("mouseup")
            element.dispatchEvent(new MouseEvent("click", {
                bubbles: true,
                cancelable: false,
                clientX: coordX,
                clientY: coordY,
                button: 0
            }));
            console.log("click")
        }
        for (let span of names_listed) {
            //console.log(`searching span: ${span.innerText} | [${span.innerText.slice(0, keypress.length).toUpperCase()}] =?= [${keypress.toUpperCase()}]`);
            if (type === 'snap') {
                if (span.innerText.slice(0, keypress.length).toUpperCase() == keypress.toUpperCase()) {
                    simulateClick(span);
                    span.scrollIntoView();
                    break;
                }
            }

            if (type === 'find') {
                if (span.innerText.toUpperCase().includes(keypress.toUpperCase())) {
                    simulateClick(span);
                    span.scrollIntoView();
                    break;
                }
            }
        }
    };

    // LOG USE OF THIS TOOL:
    // Sends timestamp of usage to RESTful API server
    function log_usage() {
        const APIURL = "http://samsara-nc:8080/wave-hello";

        // Identify ScriptEngine
        let scriptEngine;
        if (typeof GM_info === "undefined") {
            scriptEngine = "Unknown, could be scriptish or something even rarer";
        } else {
            scriptEngine = GM_info.scriptHandler || "GreaseMonkey";
        }

        // Construct payload
        let payload = {
            'user': document.getElementById("OFFICER_NAME").value,
            'time': Date.now(),
            'version': AASMVERSION,
            'scriptengine': scriptEngine,
            'userstring': navigator.userAgent,
        };

        GM_xmlhttpRequest({
            method: 'POST',
            url: APIURL,
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify(payload),
            onload: function (response) {
                if (AASMVERSION < JSON.parse(response.responseText).version) {
                    document.querySelector("#btn-update").style.display = "block";
                }
            }
        });
    };
    log_usage();

    // Advertise update if one if available (display === "block" when update available -see log_usage() function)
    function advertise_update() {
        let btn = document.querySelector("#btn-update");
        if (btn.style.display === "none")
            return;

        // now wobble the update button every n milliseconds
        setInterval(function wobble() {
            btn.style.visibility = "none";
            btn.classList.add('animate__animated', 'animate__rubberBand');
            btn.style.visibility = "";
            btn.addEventListener("animationend", function _wobbleFinished(event) {
                btn.classList.remove('animate__animated', 'animate__rubberBand');
                btn.removeEventListener("animationend", _wobbleFinished);
            });
        }, 30000); // 5 minutes
    };

    // PASTE IMG INTO EMAIL
    function enable_paste_image() {
        // daemon will hit this often so return immediately if we're not in a rich text editor
        if (document.activeElement.contentWindow.document.activeElement.getAttribute("id").search('richtexteditor') === -1) {
            return;
        }

        document.activeElement.contentWindow.document.activeElement.onpaste = (pasteEvent) => {
            let item = pasteEvent.clipboardData.items[0];

            if (item.type.indexOf("image") === 0) {
                let blob = item.getAsFile();

                let reader = new FileReader();
                reader.onload = function (event) {

                    // grab text area
                    let p = document.activeElement.contentWindow.document.activeElement.querySelector("p table p table").parentNode.previousSibling.previousSibling.previousSibling.previousSibling;

                    // create image
                    let img = document.createElement("img");

                    // insert after element.
                    p.parentNode.insertBefore(img, p.nextSibling);

                    // now paste
                    img.src = event.target.result;
                };
                reader.readAsDataURL(blob);
            }
        }
    };


    // Clear search (fire)
    function add_fire() {
        // daemon will hit this often so return if we're not in the right spot
        if (!!document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#aasm-fire"))
            return;

        // return if fire has already been added
        if (!!document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#aasm-fire"))
            return;

        // add fire element
        let fire = document.createElement("div");
        fire.setAttribute("id", "aasm-fire");
        fire.setAttribute("style", "cursor: pointer; position: fixed; right: 1rem; bottom: 1.1rem; font-size: 1.5rem;");
        fire.innerHTML = '🔥';

        // attach to dom
        let asmClear = document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#BTN_CLEAR");
        asmClear.parentNode.appendChild(fire);

        // create onclick event listener
        document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#aasm-fire").addEventListener("click", () => {
            document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#BTN_CLEAR").click();
            let btns = document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelectorAll("button.search-control-clear-btn.selected:not([style*='display:none'])");
            for (let b of btns) {
                b.click();
            }
        });
    }

    // Reorder tabs with Drag and Drop API. This API came with HTML5
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
    // Some notes:
    //  [*] onDragOver() and onDrop() must exist for on an element to be considered a dropzone
    //  [*] event.preventDefault(); prevents the browser's default reaction to getting something dropped on. Typically
    //      it'll try and open(thing_dropped) as if it was a file. Well, that's Firefox's behaviour at least.
    let dragAndDropState = {
        draggedTab: null, // element: tab being dragged
        nearestTab: null, // element: neighbouring tab when user 'drops'
        position: null, // string: [left|right] relative position to neighbour (to the left or right of neighbour)
        inDropZone: false // boolean: used when user drops in out of bounds area.
    };
    let indicationTab = document.createElement("li");
    indicationTab.setAttribute("class", "tab");
    indicationTab.setAttribute("id", "aasm-indication-tab");
    indicationTab.style.backgroundColor = "rgba(0, 150, 220, 0.19)";
    indicationTab.style.position = "relative";
    indicationTab.style.pointerEvents = "none";

    function _onDragStart(event) {
        indicationTab.style.width = event.target.getBoundingClientRect().width; // set fake, blue tab's width
        event.dataTransfer.effectAllowed = "move"; // allows 'move' cursor to be set in _onDragOver
        dragAndDropState.draggedTab = event.target; // save reference to tab being dragges
        const blankCanvas = document.createElement('canvas');
        event.dataTransfer.setDragImage(blankCanvas, 0, 0); // remove "ghost image" from cursor

        // Tab being dragged should disappear from view.
        // Modifying the dom here causes Edge to glitch-out unless wrapped in a setTimeout().
        // The workaround below is courtesy of: https://stackoverflow.com/a/20734159
        setTimeout(() => {
            event.target.parentNode.removeChild(event.target);
        }, 0);

        // Edge incorrectly fires _onDragEnd() when hovering over child elements 'w pointer events, like our close-icon [x]
        // Fix courtesy of: https://stackoverflow.com/a/14027995
        let children = document.querySelectorAll("li.tab div");
        for (let c of children) { c.style.pointerEvents = "none"; }
    };

    function _onDragOver(event) {
        event.dataTransfer.dropEffect = "move";
        // Indicate the new position while we drag the tab.
        // This is done by inserting a fake, blue tab somewhere. To work out where, we find which tab the
        // mouse is currently nearest to, then figure out which side (left or right). We also store this
        // information for later, we need it when the user drops a tab, i.e., let's go

        // mouse is nearest to which tab?
        let nearestTab = null;
        let tabs = document.querySelectorAll("li[tabindex='1']"); // all tabs that aren't the fake blue one
        let mouseDistanceMinimum = Number.MAX_SAFE_INTEGER; // arbitrarily large initial condition
        for (let t of tabs)
        {
            let tabDimensions = t.getBoundingClientRect();
            let middle = tabDimensions.x + tabDimensions.width / 2; // only x dimension matters.
            let mouseDistanceFromCurrentTab = Math.abs(event.clientX - middle);
            if (mouseDistanceFromCurrentTab < mouseDistanceMinimum)
            {
                mouseDistanceMinimum = mouseDistanceFromCurrentTab;
                nearestTab = t;
            }
        }

        // mouse to the left or right of nearestTab?
        let position;
        let tabDimensions = nearestTab.getBoundingClientRect();
        let mouseDistanceFromLeft = Math.abs(event.clientX - tabDimensions.left);
        let mouseDistanceFromRight = Math.abs(event.clientX - tabDimensions.right);

        // insert fake, blue tab
        if (mouseDistanceFromLeft < mouseDistanceFromRight)
        {
            position = "left";
            nearestTab.insertAdjacentElement('beforebegin', indicationTab);
        }

        if (mouseDistanceFromRight < mouseDistanceFromLeft)
        {
            position = "right";
            nearestTab.insertAdjacentElement('afterend', indicationTab);
        }

        // store position and nearest tab for drop event
        dragAndDropState.nearestTab = nearestTab;
        dragAndDropState.position = position;
        event.preventDefault();
    };

    function _onDrop(event) {
        // remove fake, blue tab
        let e = document.getElementById("aasm-indication-tab");
        e.parentNode.removeChild(e);

        // insert real tab
        if (dragAndDropState.position === "left")
            dragAndDropState.nearestTab.insertAdjacentElement('beforebegin', dragAndDropState.draggedTab);

        if (dragAndDropState.position === "right")
            dragAndDropState.nearestTab.insertAdjacentElement('afterend', dragAndDropState.draggedTab);

        // undo Edge hack (makes 'close' icons [x] clickable again)
        let children = document.querySelectorAll("li.tab div");
        for (let c of children) { c.style.pointerEvents = "inherit"; }
        event.preventDefault();
    };

    function _onDragEnd(event) {
        // if user let go out of bounds, add tab back to dom and remove fake, blue tab
        if (!document.body.contains(dragAndDropState.draggedTab)) {
            document.querySelector("ul.inner-tab-view").appendChild(dragAndDropState.draggedTab);
            let e = document.getElementById("aasm-indication-tab");
            e.parentNode.removeChild(e);
        }
        // animate tab back into view
        dragAndDropState.draggedTab.classList.add('animate__animated', 'animate__slideInUp');
        dragAndDropState.draggedTab.addEventListener("animationend", function _tabAdded(event) {
            dragAndDropState.draggedTab.classList.remove('animate__animated', 'animate__slideInUp');
            dragAndDropState.draggedTab.removeEventListener("animationend", _tabAdded);
        });
        event.preventDefault();
    };

    function enable_tab_reordering() {
        let tabs = document.querySelectorAll("li.tab");
        for (let t of tabs) {
            t.setAttribute("draggable", "true");
            t.addEventListener("dragend", _onDragEnd);
        }
        let dropzone = document.querySelector(".outer-tab-view");
        dropzone.addEventListener("dragstart", _onDragStart);
        dropzone.addEventListener("dragover", _onDragOver);
        dropzone.addEventListener("drop", _onDrop);
    };

    function disable_tab_reordering() {
        let dropzone = document.querySelector(".outer-tab-view");
        dropzone.removeEventListener("dragstart", _onDragStart);
        dropzone.removeEventListener("dragover", _onDragOver);
        dropzone.removeEventListener("drop", _onDrop);
        let tabs = document.querySelectorAll("li.tab");
        for (let t of tabs) {
            t.removeAttribute("draggable");
            t.removeEventListener("dragend", _onDragEnd);
        }
    };

    // DAEMON
    function augmented_asm_daemon() {
        if (dark_mode_flag) {
            modify_all_documents(window.top.frames, add_stylesheet, darkModeElement)
            modify_all_documents(window.top.frames, add_stylesheet, darkModeTintStyle)
            modify_all_documents(window.top.frames, cascade_dark_mode, darkModeElement)
        }

        // `Augment` button off? Go no further
        if (!augment_flag)
        {
            try {disable_tab_reordering()} catch {null}
            return;
        };

        // apply readability mode for any new tabs.
        readability_mode(true);

        // apply sliders to any new tabs
        try { adjust_tab_content_size(); } catch { null; }
        try { adjust_tab_width(); } catch { null; }
        try { adjust_row_height(); } catch { null; }


        // apply enable pasting into emails.
        try { enable_paste_image(); } catch { null; }

        // apply snap and search buttons
        try { add_finger_and_search_icons(); } catch { null; }

        // apply fire button (clear search)
        try { add_fire(); } catch { null; }

        // apply tab reordering
        try { enable_tab_reordering(); } catch { null; }
    }

    // advertise update
    advertise_update();

    augmented_asm_daemon();
    setInterval(function () {
        augmented_asm_daemon()
    }, 500)
})();