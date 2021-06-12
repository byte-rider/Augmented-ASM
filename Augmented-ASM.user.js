// ==UserScript==
// @name         Augmented-ASM
// @namespace    augmented-asm
// @version      1.1
// @description  modify cosmetic elements of ASM to be more productive
// @author       George (edw19b)
// @match        https://servicecentre.csiro.au/Production/core.aspx
// @run-at       document-end
// @updateURL    https://github.com/george-edwards-code/Augmented-ASM/raw/master/Augmented-ASM.user.js
// @downloadURL  https://github.com/george-edwards-code/Augmented-ASM/raw/master/Augmented-ASM.user.js
// @grant        GM_xmlhttpRequest
// @connect      samsara-nc
// ==/UserScript==

const aasmversion = "1.1";

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

#aasm_controls .watermark {
    position: absolute;
    left: 44rem;
    top: 3rem;
    font-size: 3.5rem;
    opacity: 0.2;
    font-family: 'Caveat', cursive;
}

`;

/* Styles for the so-called "readability mode". It'll be wrapped
in <style> tags and injected at various locations because Alemba
use iframes for tabs. !important unfortunately required as Alemba
make use of them all over the shop */
const cssReadabilityMode = `
/* Makes fields easier to read */
.Field[readonly], INPUT[disabled], .Field-Dropdown[disabled]{
  color: #4F0202 !important;
  border-color: #4F0202 !important;
}

input.form-control[disabled] {
  opacity: 1 !important;
}

div[readonlyisreadonly] > label {
	color: inherit;
}

input.readonly, .search-control .search-control-input.readonly, .tiered-list-container .input-group > input.form-control, input[id*="TELEPHONE"][readonly] + a.telephon {
  border-color: #4F0202 !important;
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

(function() {
    'use strict';

    // HTML SCAFFOLDING - CONTROLS
    // NOTE: div's where one might put <label> or <span>
    // this is to avoid unwanted CSS
    document.getElementById("AlembaToolbar").innerHTML += `
    <div id="aasm_controls">
      <div class="aasm-flex-item">
        <button id="btn-hide" class="aasm-button">hide</button>
        <button id="btn-augment" class="aasm-button">augment</button>
        <button id="btn-default" class="aasm-button">default</button>
        <button id="btn-about" class="aasm-button">about</button>
      </div>
      <div class="aasm-flex-item">
        <input id="slider-contents" class="slider" type="range" min="1.0" max="2.0" step="0.05">
        <div class="slider-label">tab-contents</div>
      </div>
      <div class="aasm-flex-item">
        <input id="slider-maxwidth" class="slider" type="range" min="0" max="1.0" step="0.025">
        <div class="slider-label">tab-minwidth</div>
      </div>
      <div class="aasm-flex-item">
        <input id="slider-description" class="slider" type="range" min="1.3" max="7.0" step="0.05">
        <div class="slider-label">description</div>
        <div class="watermark">Augmented-ASM v${aasmversion}</div>
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
    styleElementAASM.type = "text/css";
    styleElementAASM.innerHTML = cssControls;
    (document.head || document.documentElement).appendChild(styleElementAASM);

    // BUTTON HIDE
    document.querySelector("#aasm_controls #btn-hide").addEventListener("click", hide);
    function hide()
    {
        document.querySelector("#aasm_controls").style.display = "none";
        document.querySelector("#aasm_controls-2").style.display = "flex";
    }

    // BUTTON SHOW
    document.querySelector("#aasm_controls-2 #btn-show").addEventListener("click", show);
    function show()
    {
        document.querySelector("#aasm_controls").style.display = "flex";
        document.querySelector("#aasm_controls-2").style.display = "none";
    }

    // WASTED SPACE
    function wastedSpace(toggleOn)
    {
        let e = document.querySelector(".outer-tab-view");
        (toggleOn) ? e.style.marginLeft = "0rem" : e.style.marginLeft = "20px";
    }

    // NAVBAR FIX
    function navbarFix(toggleOn)
    {
        let e = document.querySelector("#AlembaToolbar .navbar-nav");
        (toggleOn) ? e.style.minWidth = "570px" : e.style.minWidth = "410px";
    }

    // READABILITY MODE
    function readabilityMode(toggleOn)
    {
        function action(bool_apply_or_remove)
        {
            // ASM deliver tabbed content through iFrames. We must iterate through them all
            // and append our own <style> tag in each frame, ensuring all tabs are re-styled.
            // This allows us to undo by removing each <style> tag appropriately.
            let asm_iframes = document.querySelectorAll(".busy-content");

            // APPLY
            if (bool_apply_or_remove) {
                for (let i = 0; i < asm_iframes.length; i++)
                {
                    try
                    {
                        if (!asm_iframes[i].contentWindow.document.querySelector("#Main").contentWindow.document.getElementById(`readability_mode_css${i}`))
                        {
                            // create <style>
                            let readability_mode_css = document.createElement('style');
                            readability_mode_css.type = "text/css";
                            readability_mode_css.setAttribute("id", `readability_mode_css${i}`);
                            readability_mode_css.innerHTML = cssReadabilityMode;

                            try // try to inject <style>
                            {
                                asm_iframes[i].contentWindow.document.querySelector("#Main").contentWindow.document.body.appendChild(readability_mode_css);
                            }
                            catch(err) {
                                // nothing to do
                            }
                        }
                    }
                    catch(err) {
                        // nothing to do
                    }
                }
            }

            // REMOVE
            if (!bool_apply_or_remove) {
                for (let i = 0; i < asm_iframes.length; i++)
                {
                    try // try to delete <style> from iframe context
                    {
                        asm_iframes[i].contentWindow.document.querySelector("#Main").contentWindow.document.getElementById(`readability_mode_css${i}`).remove();
                        console.log(asm_iframes[i]);
                    }
                    catch(err)
                    {
                        // console.log(`asm_iframes[${i}] is not the iframe we're looking for.`);
                    }
                }
            }
        }
        readabilityMode.action = action;
        (toggleOn) ? action(true) : action(false);

    }

    // BUTTON AUGMENT
    let augment_flag = false;
    document.querySelector("#btn-augment").addEventListener("click", augment);
    function augment() {

        // turn augments on
        if (!augment_flag) {
            wastedSpace(true);
            navbarFix(true);
            readabilityMode(true);
        }

        // turn augments off
        if (augment_flag) {
            wastedSpace(false);
            navbarFix(false);
            readabilityMode(false);
        }

        // change button accordingly
        (augment_flag) ? document.querySelector("#btn-augment").classList.remove("aasm-button-active") : document.querySelector("#btn-augment").classList.add("aasm-button-active");

        // toggle flag
        augment_flag = ~augment_flag;
    }

    // BUTTON RESET TO DEFAULT
    document.querySelector("#aasm_controls #btn-default").addEventListener("click", setDefault);
    function setDefault()
    {
        // reset 1st slider (tab content size)
        let tabs = document.querySelectorAll(".tab");
        let tabs_icon = document.querySelectorAll(".tab-label-image");
        let tabs_text = document.querySelectorAll(".tab-label-text");
        let tabs_close = document.querySelectorAll(".tab-label-close");
        for (let i = 0; i < tabs_text.length; i++)
        {
            tabs_icon[i].style.width = "16px";
            tabs_icon[i].style.height = "16px";
            tabs_text[i].style.fontSize = "inherit";
            tabs_text[i].style.marginLeft = "20px";
            tabs_text[i].style.marginRight = "25px";
            tabs_close[i].style.width = "16px";
            tabs_close[i].style.height = "16px";
        }

        // reset 2nd slider (tab width)
        for (let i = 0; i < tabs_text.length; i++)
        {
            tabs_text[i].style.maxWidth = "200px";
        }

        // reset third slider (description)
        slider_description.value = 1;
        slider_description.oninput();


        // toggle buttons if they're on.
        (augment_flag) ? augment() : null;
    }

    // BUTTON ABOUT
    document.querySelector("#aasm_controls #btn-about").addEventListener("click", aboutAlert);
    function aboutAlert()
    {
        window.prompt(`Augmented-ASM v${aasmversion}
bugs and/or requests go to`, "George.Edwards@csiro.au");
    }

    // FIRST SLIDER - (SIZE OF TAB CONTENTS)
    let slider_contents = document.querySelector("#aasm_controls #slider-contents");
    slider_contents.oninput = function()
    {
        let tabs = document.querySelectorAll(".tab");
        let tabs_icon = document.querySelectorAll(".tab-label-image");
        let tabs_text = document.querySelectorAll(".tab-label-text");
        let tabs_close = document.querySelectorAll(".tab-label-close");
        for (let i = 0; i < tabs_text.length; i++)
        {
            tabs_icon[i].style.width = slider_contents.value + "rem";
            tabs_icon[i].style.height = slider_contents.value + "rem";
            tabs_text[i].style.fontSize = slider_contents.value + "rem";
            tabs_text[i].style.marginLeft = slider_contents.value + "rem";
            tabs_text[i].style.marginRight = slider_contents.value + "rem";
            tabs_close[i].style.width = slider_contents.value + "rem";
            tabs_close[i].style.height = slider_contents.value + "rem";
        }
    }
    // SECOND SLIDER - (TAB MAX-WIDTH)
    let slider_maxwidth = document.querySelector("#aasm_controls #slider-maxwidth");
    slider_maxwidth.oninput = function()
    {
        let tabs_text = document.querySelectorAll(".tab-label-text");
        let max_width = 50 * slider_maxwidth.value;
        for (let i = 0; i < tabs_text.length; i++)
        {
            tabs_text[i].style.maxWidth = max_width + "rem";
        }
    }

    // THIRD SLIDER - (DESCRIPTION)
    let slider_description = document.querySelector("#aasm_controls #slider-description");
    slider_description.value = 1.3;
    slider_description.oninput = function()
    {
        // default is 19px
        let asm_iframes = document.querySelectorAll(".busy-content");

        for (let i = 0; i < asm_iframes.length; i++)
        {
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
    function keyboard_lookup(type)
    {
        let keypress = prompt(`${type}-to`, "");
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

        let simulateClick = function(element) {
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
        for (let span of names_listed)
        {
            //console.log(`searching span: ${span.innerText} | [${span.innerText.slice(0, keypress.length).toUpperCase()}] =?= [${keypress.toUpperCase()}]`);
            if (type === 'snap') {
                if (span.innerText.slice(0, keypress.length).toUpperCase() == keypress.toUpperCase()) {
                    simulateClick(span);
                    span.scrollIntoView();
                    break;
                }
            }

            if (type === 'search') {
                if (span.innerText.toUpperCase().includes(keypress.toUpperCase())) {
                    simulateClick(span);
                    span.scrollIntoView();
                    break;
                }
            }
        }
    };

    // PASTE IMG INTO EMAIL
    // "onpaste" Function (daemon apply's this function to an event listener)
    function aasmPaste(pasteEvent) {
        let item = pasteEvent.clipboardData.items[0];

        if (item.type.indexOf("image") === 0) {
            let blob = item.getAsFile();

            let reader = new FileReader();
            reader.onload = function(event)	{

                // grab text area
                let p = document.activeElement.contentWindow.document.activeElement.querySelector("p table p table").parentNode.previousSibling.previousSibling.previousSibling.previousSibling;

                // create image
                let img = document.createElement("img");
                img.setAttribute("id", "PastedIMG");

                // insert after element.
                p.parentNode.insertBefore(img, p.nextSibling);

                // now paste
                document.activeElement.contentWindow.document.activeElement.querySelector("#PastedIMG").src = event.target.result;
            };
            reader.readAsDataURL(blob);
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
        let payload =
            {
                'user' : document.getElementById("OFFICER_NAME").value,
                'time' : Date.now(),
                'version': aasmversion,
                'scriptengine': scriptEngine,
                'userstring': navigator.userAgent,
            };

        GM_xmlhttpRequest({
            method: 'POST',
            url: APIURL,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify(payload),
            onload: function(response) {
                console.log(response.responseText);
            }
        });
    };
    log_usage();

    function augmented_asm_daemon()
    {
        if (!augment_flag)
            return;

        // apply readability mode for any new tabs.
        readabilityMode.action(true);

        // apply enable pasting into emails.
        try {
            if (document.activeElement.contentWindow.document.activeElement.getAttribute("id").search('richtexteditor') != -1)
                document.activeElement.contentWindow.document.activeElement.onpaste = aasmPaste;
        }
        catch { null; }

        // apply snap and search buttons
        if (!!document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#SPAN_IN_OFFICERS_")) {
            // Insert buttons if not already there
            if (!document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#aasm-searchto")) {

                // create buttons
                let btn1 = document.createElement("div");
                btn1.setAttribute("id", "aasm-snapto");
                btn1.setAttribute("style", "margin-right: 2rem; cursor: pointer;");
                btn1.innerHTML = '🔎 snap';

                let btn2 = document.createElement("div");
                btn2.setAttribute("id", "aasm-searchto");
                btn2.setAttribute("style", "margin-right: 2rem; cursor: pointer;");
                btn2.innerHTML = '🔎 search';

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
                btn2.addEventListener("click", () => keyboard_lookup('search'));
            }
        }
    }

    augmented_asm_daemon();
    setInterval(function(){
        augmented_asm_daemon()
    }, 500)


})();

