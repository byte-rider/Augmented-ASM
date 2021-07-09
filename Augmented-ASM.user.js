// ==UserScript==
// @name         Augmented-ASM
// @namespace    augmented-asm
// @version      1.52
// @description  modify cosmetic elements of ASM to be more productive
// @author       George (edw19b)
// @match        https://servicecentre.csiro.au/Production/core.aspx
// @run-at       document-end
// @updateURL    https://github.com/george-edwards-code/Augmented-ASM/raw/master/Augmented-ASM.user.js
// @downloadURL  https://github.com/george-edwards-code/Augmented-ASM/raw/master/Augmented-ASM.user.js
// @resource     AASM_CSS https://raw.githubusercontent.com/george-edwards-code/Augmented-ASM/master/css/aasm.css
// @resource     READABILITY_MODE_CSS https://raw.githubusercontent.com/george-edwards-code/Augmented-ASM/master/css/readability-mode.css
// @resource     DARK_MODE_CSS https://raw.githubusercontent.com/george-edwards-code/Augmented-ASM/master/css/dark-mode.css
// @connect      samsara-nc
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

/*
 _   _                  _     _
| |_| |__   ___    __ _(_)___| |
| __| '_ \ / _ \  / _` | / __| __|
| |_| | | |  __/ | (_| | \__ \ |
 \__|_| |_|\___|  \__, |_|___/\__|
                  |___/

    A series of Javascript functions that do stuff to the page.

    There are CSS files that get loaded into memory (see @resource declarations above) and
    are inserted/removed into the dom at various times (for example there's a 'dark mode').

    There is a daemon which runs every 500 milliseconds. The daemon keeps watch of certain
    flags and either runs or doesn't run various functions. This is how something can be applied to a page
    that doesn't exist in the DOM when the user toggles it on. The daemon will keep watch and apply once it exists.

    All headings made with the 'ogre' font here: http://www.network-science.de/ascii/
*/

/*
                       _
 _ __   __ _ _ __ ___ (_)_ __   __ _
| '_ \ / _` | '_ ` _ \| | '_ \ / _` |
| | | | (_| | | | | | | | | | | (_| |
|_| |_|\__,_|_| |_| |_|_|_| |_|\__, |
                               |___/
                                _   _
  ___ ___  _ ____   _____ _ __ | |_(_) ___  _ __  ___
 / __/ _ \| '_ \ \ / / _ \ '_ \| __| |/ _ \| '_ \/ __|
| (_| (_) | | | \ V /  __/ | | | |_| | (_) | | | \__ \
 \___\___/|_| |_|\_/ \___|_| |_|\__|_|\___/|_| |_|___/

HTML:
    #hyphen-between-id-words
    .hyphen-between-class-words

Functions:
    function_names_have_underscores_because_alembas_dont()
    _leading_underscore_for_event_listeners()
    trailing_underscores_if_called_by_daemon_()
    _this_function_is_both_event_listener_and_called_by_daemon_()

    No declarative Functions to avoid polluting global namespace. Function expressions used instead.
    Yes, TamperMonkey respects @namespace declaration but it's still a good practice to practise.

    function something() {}           // NO - function's scope can pollute global namespace
    const something = () => {}        // YES - 'let' also fine.
    const something = function() {}   // YES - 'let' also fine.

Variables:
    camelCase always; local scope only; booleans to be verbed, eg: lightIsFlashing, flagIsUp, somethingIsTrue
    myVariable          // NO - global scope - variable can overwrite some other 'myVaribale' on the global namespace
    var myVariable      // NO - function scope - variable can overwrite some other 'myVaribale' within entire function
    let myVariable      // YES - variable will have block-level scope
    const myVariable    // YES - variable will have block-level scope
*/

debugger;

const AASMVERSION = "1.52";

(function () {
    'use strict';

    /*       _____           __
      /\  /\/__   \ /\/\    / /
     / /_/ /  / /\//    \  / /
    / __  /  / /  / /\/\ \/ /___
    \/ /_/   \/   \/    \/\____/
    */
    // HTML SCAFFOLDING - CONTROLS
    // NOTE: <div>'s where one might put <label> or <span>. This is to avoid unwanted Alemba CSS
    document.getElementById("AlembaToolbar").innerHTML += `
    <div id="aasm-controls">
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
        <div class="aasm-watermark">Augmented-ASM v${AASMVERSION}</div>
      </div>
    </div>
    <div id="aasm-controls-2">
      <div class="aasm-flex-item">
        <button id="btn-show" class="aasm-button">show</button>
      </div>
    </div>
    `;

    /*
       ___  __  __
      / __\/ _\/ _\
     / /   \ \ \ \
    / /___ _\ \_\ \
    \____/ \__/\__/
    */

    // INJECT Augmented-ASM CSS
    const aasmRawCSS = GM_getResourceText("AASM_CSS");
    const aasmCSSElement = GM_addStyle(aasmRawCSS);
    aasmCSSElement.id = "aasm-css";

    // INJECT ANIMATION CSS LIBRARY (https://animate.style/)
    const animate = document.createElement('link');
    animate.type = "text/css";
    animate.rel = 'stylesheet';
    animate.href = "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css";
    document.head.appendChild(animate);

    /*
         _ _     _
     ___| (_) __| | ___ _ __ ___
    / __| | |/ _` |/ _ \ '__/ __|
    \__ \ | | (_| |  __/ |  \__ \
    |___/_|_|\__,_|\___|_|  |___/

    */

    // FIRST SLIDER - (TAB CONTENTS)
    const sliderContents = document.querySelector("#aasm-controls #slider-contents");
    const _adjust_tab_content_size_ = () => {
        const tabs = document.querySelectorAll(".tab");
        const tabsIcon = document.querySelectorAll(".tab-label-image");
        const tabsInnerText = document.querySelectorAll(".tab-label-text");
        const tabsCloseIcon = document.querySelectorAll(".tab-label-close");
        for (let i = 0; i < tabs.length; i++) {
            tabsIcon[i].style.width = sliderContents.value + "rem";
            tabsIcon[i].style.height = sliderContents.value + "rem";
            tabsInnerText[i].style.fontSize = sliderContents.value + "rem";
            tabsInnerText[i].style.marginLeft = sliderContents.value + "rem";
            tabsInnerText[i].style.marginRight = sliderContents.value + "rem";
            tabsCloseIcon[i].style.width = sliderContents.value + "rem";
            tabsCloseIcon[i].style.height = sliderContents.value + "rem";
        }
    };
    sliderContents.addEventListener("input", _adjust_tab_content_size_);

    // SECOND SLIDER - (TAB MAX-WIDTH)
    const sliderMaxWidth = document.querySelector("#aasm-controls #slider-maxwidth");
    function _adjust_tab_width_() {
        const tabsInnerText = document.querySelectorAll(".tab-label-text");
        const maxWidth = 50 * sliderMaxWidth.value;
        for (let t of tabsInnerText) {
            t.style.maxWidth = `${maxWidth}rem`;
        }
    }
    sliderMaxWidth.addEventListener("input", _adjust_tab_width_);

    // THIRD SLIDER - (DESCRIPTION)
    const thirdSliderHasChanged = false;
    const sliderDescription = document.querySelector("#aasm-controls #slider-description");
    sliderDescription.value = 1.3;
    const _adjust_row_height_ = () => {
        const asmIframes = document.querySelectorAll(".busy-content");

        for (let i = 0; i < asmIframes.length; i++) {
            if (!asmIframes[i].contentWindow.document.querySelector("[name='Main']").contentWindow.document.getElementById(`description-css${i}`)) {
                // create <style>
                const descriptionCss = document.createElement('style');
                descriptionCss.setAttribute("id", `description-css${i}`);
                descriptionCss.innerHTML = "";
                asmIframes[i].contentWindow.document.querySelector("[name='Main']").contentWindow.document.body.appendChild(descriptionCss);
            }

            if (sliderDescription.value != 1.3) {
                asmIframes[i].contentWindow.document.querySelector("[name='Main']").contentWindow.document.getElementById(`description-css${i}`).innerHTML = `
                .e-rowcell .string-container {
                    max-height: ${sliderDescription.value}rem;
                }
                .e-row {
                    outline: 1px solid;
                }`
            } else {
                asmIframes[i].contentWindow.document.querySelector("[name='Main']").contentWindow.document.getElementById(`description-css${i}`).innerHTML = `
                .e-rowcell .string-container {
                    max-height: ${sliderDescription.value}rem;
                }
                .e-row {
                    outline: none;
                }`
            }
        }
    }
    sliderDescription.addEventListener("input", _adjust_row_height_);

    /*
     _           _   _
    | |__  _   _| |_| |_ ___  _ __  ___
    | '_ \| | | | __| __/ _ \| '_ \/ __|
    | |_) | |_| | |_| || (_) | | | \__ \
    |_.__/ \__,_|\__|\__\___/|_| |_|___/

    */

    /*----------------------------------
    ||       HIDE
    ---------------------------------------------------------*/
    document.querySelector("#aasm-controls #btn-hide").addEventListener("click", () => {
        document.querySelector("#aasm-controls").style.display = "none";
        document.querySelector("#aasm-controls-2").style.display = "flex";
    });

    /*----------------------------------
    ||       SHOW
    ---------------------------------------------------------*/
    document.querySelector("#aasm-controls-2 #btn-show").addEventListener("click", () => {
        document.querySelector("#aasm-controls").style.display = "flex";
        document.querySelector("#aasm-controls-2").style.display = "none";
    });

    /*----------------------------------
    ||       AUGMENT
    ---------------------------------------------------------*/
    let augmentIsOn = false;
    const _augment = () => {
        augmentIsOn = ~augmentIsOn;
        const btn = document.querySelector("#btn-augment");

        if (augmentIsOn) {
            navbarFix(true);
            readability_mode_(true);
        }

        if (!augmentIsOn) {
            navbarFix(false);
            readability_mode_(false);
        }

        // toggle [augment] button style accordingly
        (augmentIsOn) ? btn.classList.add("aasm-button-active") : btn.classList.remove("aasm-button-active");

    };
    document.querySelector("#btn-augment").addEventListener("click", _augment);

    /*----------------------------------
    ||       DARK MODE
    ---------------------------------------------------------*/
    /* Adds two <style> elements to every iframe document's <head>.
    The first <style> element contains the dark mode CSS.
    The other <style> element contains the user's preference of "tint" colour, which they can choose through a colour picker.

    These two style elements are held in memory and clones of them are inserted and removed.

    The tint colour will be <head>'s second-last child.
    The Dark Mode will be <head>'s last child.

    document
        <html>
            <head>
                <link>
                ...
                <style>  <-- tint colour
                <style>  <-- dark mode css
            </head>
            ...
        </html>

    The reason for inserting as second-last child is to stop flickering when the user changes the tint colour.
    This flickering happened because when the <style> containing the new tint colour was inserted /after/
    dark-mode then things were repainted, after all, the C in CSS stands for cascading.
    */
    let darkModeIsOn = false;

    // Tint colour element, like this: <style> :root {--tint: #123456;} </style>
    const darkModeTintStyleElement = document.createElement('style');
    darkModeTintStyleElement.id = "dark-mode-tint";
    darkModeTintStyleElement.innerHTML = `:root {--tint: ${document.getElementById("colour-picker").value};}`;

    // Dark mode <style> element.
    const darkModeRawCss = GM_getResourceText("DARK_MODE_CSS");
    const darkModeElement = GM_addStyle(darkModeRawCss);
    darkModeElement.id = "dark-mode";
    document.getElementById("dark-mode").remove(); // GM_addStyle() returns a <style> element, yes, but it also adds it to the page which we don't want yet

    /* Recursive function that takes a NodeList of frames, a callback function and a <style> element as parameters arguments.
    It will crawl through the DOM, plucking out every iframe and sending its "document" property into the callback as an argument, along with the element parameter.
    It'll be up to the callback function to manipulate the document with the element however it wants (for example: removing the element from the document)
    If the first parameter is arguably 'window.top.frames' then it'll cover the entire dom, else 'window.frames' will only traverse from the current frame in focus (never used this way)
    */
    const modify_all_documents_ = (frames, callback, element) => {
        // stop recursion if at leaf.
        if (frames.length === 0) {
            return;
        }

        // callback on the very first document
        if (frames === window.top.frames) {
            callback(frames.document, element);
        }

        for (let i = 0; i < frames.length; i++) {
            // callback on all children documents
            callback(frames[i].document, element);

            // Douglas Hofstadter, baby
            modify_all_documents_(frames[i], callback, element);
        }
    }

    /* Adds a copy of element to document's <head> as second-last child (if possible, otherwise as only child) */
    const add_stylesheet = (document, element) => {
        // only add element if it's not already there
        if (!document.contains(document.getElementById(`${element.id}`))) {
            if (element.children.length === 0) {
                document.head.append(element.cloneNode(true));
            } else {
                document.head.lastElementChild.insertAdjacentElement('beforebegin', element.cloneNode(true));
            }
        }
    }

    const remove_stylesheet = (document, element) => {
        if (document.contains(document.getElementById(`${element.id}`))) {
            document.getElementById(`${element.id}`).remove();
        }
    }

    const move_element_to_second_last_place = (document, element) => {
        if (document.getElementById(element.id).nextSibling.nextSibling != null) {
            document.head.lastElementChild.insertAdjacentElement('beforebegin', document.getElementById(element.id));
        }
    }

    /* move_element_to_last_place(document, element)
    Moves the element to the end of the document's <head>. This ensures our own <style> element is being applied instead of Alemba's
    and is important when a new iframe is created and user has toggled dark mode. For example: opening a ticket starts out bright.

    The setTimeout() is there to slow things down otherwise there's an epileptic level of flicker. Alemba's server
    is really slow so their <style> elements only trickle-in (and there's hundreds). Each time we move ours past theirs the screen flashes because
    their styles are being overwritten by ours. This flashing is reduced (but not eliminated) by holding-off on moving our
    <style> by some interval, ensuring we move past many of theirs at once.

    The semaphore 🚩🙅‍♂️ is there to ensure the setTimeout behaves as though it's synchronous. The daemon runs often
    and so if dark mode is toggled this ends up getting executed often. Without the semaphore, the delay would apply
    to every execution independently as opposed to /across/ different executions. In other words, we wouldn't be slowing
    things down by some interval, we'd be time-shifting by that interval as all function calls would be setTimeout'ing themselves.
    (this approach works because semaphore variable is stored in memory and memory is atomic)
    */
    let semaphoreSaysGoAhead = true;
    const interval = 500; // delay to wait before pushing our element to the end of <head>
    const move_element_to_last_place = (document, element) => {
        if (semaphoreSaysGoAhead && document.getElementById(`${element.id}`).nextSibling != null) {
            semaphoreSaysGoAhead = false; // 🚩🙅‍♂️ <-- man signals "stop"
            setTimeout(() => {
                document.head.appendChild(document.getElementById(`${element.id}`)); // appendChild will move the element, i.e., no need to remove then re-add.
                semaphoreSaysGoAhead = true; // 🚩🙅‍♂️ <-- "go ahead" because the timeout has finished.
            }, interval);
        }
    }

    const _dark_mode = (event) => {
        darkModeIsOn = ~darkModeIsOn;

        // style the button that was just pressed
        (darkModeIsOn) ? document.getElementById("btn-dark-mode").classList.add("aasm-button-active") : document.getElementById("btn-dark-mode").classList.remove("aasm-button-active");

        // change Alemba's banner (they have it styled on the Element itself for some weird reason meaning no stylesheet could apply)
        (darkModeIsOn) ? document.querySelector("nav").style = "" : document.querySelector("nav").style = `background-image: linear-gradient(rgb(206, 217, 233), rgb(244, 246, 251)) !important;`;

        // add/remove the dark mode CSS
        (darkModeIsOn) ? modify_all_documents_(window.top.frames, add_stylesheet, darkModeElement) : modify_all_documents_(window.top.frames, remove_stylesheet, darkModeElement)

        // add/remove the dark mode tint
        // (darkModeIsOn) ? modify_all_documents_(window.top.frames, add_stylesheet, darkModeTintStyleElement) : modify_all_documents_(window.top.frames, remove_stylesheet, darkModeTintStyleElement)
        /* NOTE: for some reason the above code fails when the flag is false, i.e., when removing the <style> element.
        Alemba's jQuery catches the following error: Uncaught TypeError: modify_all_documents_(...) is not a function.
        The reason is beyond my knowledge and every other call to that function is fine. Because of this, the <style> will simply
        have to remain in the DOM; there's no harm in that because it's just one line of CSS, a line containing a colour variable named --tint
        which is never referenced by Alemba. It looks like this: `:root {--tint: #123456;}`
        */
       if (darkModeIsOn) {
           modify_all_documents_(window.top.frames, add_stylesheet, darkModeTintStyleElement)
        }
    }
    document.querySelector("#btn-dark-mode").addEventListener("click", _dark_mode);

    /* User has used the colour picker:
        record the new colour into CSS variable called: --tint.
        Then remove and re-add the "tint" <syle> from the DOM ...but only if the user has dark mode on.
    */
   document.querySelector("#colour-picker").addEventListener("input", (event) => {
       darkModeTintStyleElement.innerHTML = `:root {--tint: ${event.target.value};}`;
        if (darkModeIsOn) {
            modify_all_documents_(window.top.frames, remove_stylesheet, darkModeTintStyleElement);
            modify_all_documents_(window.top.frames, add_stylesheet, darkModeTintStyleElement);
        }
    });

    /*----------------------------------
    ||       DEFAULT
    ---------------------------------------------------------*/
    document.querySelector("#aasm-controls #btn-default").addEventListener("click", () => {
        // toggle augment off if necessary
        (augmentIsOn) ? _augment(): null;

        // toggle darkmode off if necessary
        (darkModeIsOn) ? _dark_mode() : null;

        // reset 1st slider (tab content size)
        sliderContents.value = 1.5; // visual: puts the slider back to the middle (1.5 is middle value)
        const tabs = document.querySelectorAll(".tab");
        const tabsIcon = document.querySelectorAll(".tab-label-image");
        const tabsInnerText = document.querySelectorAll(".tab-label-text");
        const tabsCloseIcon = document.querySelectorAll(".tab-label-close");
        for (let i = 0; i < tabs.length; i++) {
            tabsIcon[i].style.width = "16px";
            tabsIcon[i].style.height = "16px";
            tabsInnerText[i].style.fontSize = "inherit";
            tabsInnerText[i].style.marginLeft = "20px";
            tabsInnerText[i].style.marginRight = "25px";
            tabsCloseIcon[i].style.width = "16px";
            tabsCloseIcon[i].style.height = "16px";
            // all above values are simply the default values initially set by Alemba 
        }

        // reset 2nd slider (tab width)
        sliderMaxWidth.value = 0.5;
        for (let i = 0; i < tabsInnerText.length; i++) {
            tabsInnerText[i].style.maxWidth = "200px"; // the default set by Alemba
        }

        // reset third slider (description)
        sliderDescription.value = 1;
        _adjust_row_height_();
    });

    // BUTTON ABOUT
    document.querySelector("#aasm-controls #btn-about").addEventListener("click", () => {
        window.open("https://confluence.csiro.au/display/~edw19b/Augmented-ASM");
    });

    // BUTTON UPDATE
    document.querySelector("#aasm-controls #btn-update").addEventListener("click", () => {
        window.open("https://github.com/george-edwards-code/Augmented-ASM/raw/master/Augmented-ASM.user.js");
    });

    /*
      __            _
     / _| ___  __ _| |_ _   _ _ __ ___  ___
    | |_ / _ \/ _` | __| | | | '__/ _ \/ __|
    |  _|  __/ (_| | |_| |_| | | |  __/\__ \
    |_|  \___|\__,_|\__|\__,_|_|  \___||___/

    */

    /*----------------------------------
    ||       NAVBAR FIX
    ---------------------------------------------------------*/
    const navbarFix = (toggleOn) => {
        const e = document.querySelector("#AlembaToolbar .navbar-nav");
        (toggleOn) ? e.style.minWidth = "570px": e.style.minWidth = "410px";
    }

    /*----------------------------------
    ||       READABILITY MODE
    ---------------------------------------------------------*/
    // <style> element
    const readabilityModeRawCSS = GM_getResourceText("READABILITY_MODE_CSS");
    const readabilityModeElement = GM_addStyle(readabilityModeRawCSS);
    readabilityModeElement.id = "readability-mode";
    document.getElementById("readability-mode").remove(); // GM_addStyle() returns a <style> element, yes, but it also adds it to the page which we don't want yet

    const readability_mode_ = function(toggleOn) {
        // ASM deliver tabbed content through iframes. We must go through each document
        // and append our own <style> tag in each <head>, ensuring all tabs are re-styled.
        // This allows us to undo by removing each <style> tag appropriately.
        if (toggleOn) {
            modify_all_documents_(window.top.frames, add_stylesheet, readabilityModeElement);
        }

        if (!toggleOn) {
            modify_all_documents_(window.top.frames, remove_stylesheet, readabilityModeElement);
        }
    }

    /*----------------------------------
    ||     KEYBOARD SNAP TO (👇 & 🔍)
    ---------------------------------------------------------*/
    // prompts user for input, then performs a snap or search depending on 'type' argument.
    const _keyboard_lookup = (type) => {
        const keypress = prompt(`${type}`, ""); // prompts user for input. The first argument is displayed to the user, the second argument is the value already entered into the prompt for convenience.
        const activeDocument = document.activeElement.contentWindow.document.activeElement.contentWindow.document
        const cssFoo = ".e-list-item.e-level-1 .e-text-content.e-icon-wrapper img+span div span";
        const cssFooGroups = ".e-list-item.e-level-1 .e-text-content img+span div span";
        let names;

        if (activeDocument.querySelector("#SPAN_IN_OFFICERS_").getAttribute("style") != "display: none;") {
            names = activeDocument.querySelectorAll(`#SPAN_IN_OFFICERS_ ${cssFoo}`);
        }

        if (activeDocument.querySelector("#SPAN_IN_GROUPS_").getAttribute("style") != "display: none;") {
            names = activeDocument.querySelectorAll(`#SPAN_IN_GROUPS_ ${cssFooGroups}`);
        }

        if (activeDocument.querySelector("#SPAN_IN_OFFICERS_BY_GROUP_").getAttribute("style") != "display: none;") {
            names = activeDocument.querySelectorAll(`#SPAN_IN_OFFICERS_BY_GROUP_ ${cssFoo}`);
        }

        /* The below simulates a fair-dinkum click of the mouse. It's requried because it's not possible
            to use standard document interaction due to Alemba's watchdog listeners that intercept everything
            from a rightclick through to any keydown. Code courtesy of Stack Overflow user Iván Nokonoko
            Source: https://stackoverflow.com/questions/55059006/simulate-a-real-human-mouse-click-in-pure-javascript
        */
        const simulateClick = function (element) {
            const box = element.getBoundingClientRect(),
                coordX = box.left + (box.right - box.left) / 2,
                coordY = box.top + (box.bottom - box.top) / 2;
            element.dispatchEvent(new MouseEvent("mousedown", {
                bubbles: true,
                cancelable: false,
                clientX: coordX,
                clientY: coordY,
                button: 0
            }));
            element.dispatchEvent(new MouseEvent("mouseup", {
                bubbles: true,
                cancelable: false,
                clientX: coordX,
                clientY: coordY,
                button: 0
            }));
            element.dispatchEvent(new MouseEvent("click", {
                bubbles: true,
                cancelable: false,
                clientX: coordX,
                clientY: coordY,
                button: 0
            }));
        }
        for (let span of names) {
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

    /* Adds two icons for quickly selecting the recipient of a ticket.
        👇 = snap: re-creates vFire functionality of 'snapping' to a recipient by typing the first few chars of their name
        🔍 = find: searches the list of names and returns first positive match, eg: 'secur' matches 'Cyber Security'.
    */
    const add_finger_and_search_icons_ = () => {
        /*  The following if statement ensures we don't insert the icons where they don't belong. This is achieved by checking
            a string has "FORWARD" in it. The string searched is the page title when forwarding a ticket. which says:
            "FORWARD CALL 1234567 INTERNALLY"
        */
        if (!document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("div[iwtype='PageTitle'] span#heading").innerText.includes("FORWARD")) {
            return;
        }

        // Insert buttons if not already there
        if (!document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#aasm-searchto")) {

            // create buttons
            const btn1 = document.createElement("div");
            btn1.setAttribute("id", "aasm-snapto");
            btn1.setAttribute("style", "margin-right: 2rem; cursor: pointer;");
            btn1.innerHTML = '👇 snap';

            const btn2 = document.createElement("div");
            btn2.setAttribute("id", "aasm-searchto");
            btn2.setAttribute("style", "margin-right: 2rem; cursor: pointer;");
            btn2.innerHTML = '🔍 find';

            // flex container
            const wrapper = document.createElement("div");
            wrapper.setAttribute("style", "display: flex;");
            wrapper.appendChild(btn1);
            wrapper.appendChild(btn2);

            // insert into dom
            const div = document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector('table tr td div');
            div.parentNode.insertBefore(wrapper, div.nextSibling);

            // add event listeners
            btn1.addEventListener("click", () => _keyboard_lookup('snap'));
            btn2.addEventListener("click", () => _keyboard_lookup('find'));
        }
    }

    /*----------------------------------
    ||    PASTE IMG INTO EMAIL
    ---------------------------------------------------------*/
    const enable_paste_image_ = () => {
        // daemon will hit this often so return immediately if we're not in a rich text editor
        if (document.activeElement.contentWindow.document.activeElement.getAttribute("id").search('richtexteditor') === -1) {
            return;
        }

        document.activeElement.contentWindow.document.activeElement.onpaste = (pasteEvent) => {
            const item = pasteEvent.clipboardData.items[0];

            if (item.type.indexOf("image") === 0) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = function (event) {

                    // grab text area
                    const p = document.activeElement.contentWindow.document.activeElement.querySelector("p table p table").parentNode.previousSibling.previousSibling.previousSibling.previousSibling;

                    // create image
                    const img = document.createElement("img");

                    // insert after element.
                    p.parentNode.insertBefore(img, p.nextSibling);

                    // now paste
                    img.src = event.target.result;
                };
                reader.readAsDataURL(blob);
            }
        }
    };


    /*----------------------------------
    ||    Clear search (🔥)
    ---------------------------------------------------------*/
    const add_fire_ = () => {
        // daemon will hit this often so return if we're not in the right spot
        if (!!document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#aasm-fire")) {
            return;
        }

        // return if fire has already been added
        if (!!document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#aasm-fire")) {
            return;
        }

        // add fire element
        const fire = document.createElement("div");
        fire.setAttribute("id", "aasm-fire");
        fire.setAttribute("style", "cursor: pointer; position: fixed; right: 1rem; bottom: 1.1rem; font-size: 1.5rem;");
        fire.innerHTML = '🔥';

        // attach to dom
        const asmClear = document.activeElement.contentWindow.document.activeElement.contentWindow.document.querySelector("#BTN_CLEAR");
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

    /*----------------------------------
    ||    RE-ORDER TABS
    ---------------------------------------------------------*/
    // Reorder tabs with Drag and Drop API. This API came with HTML5
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
    // Some notes:
    //  [*] _on_drag_over() and _on_drop() must exist for on an element to be considered a dropzone
    //  [*] event.preventDefault(); prevents the browser's default reaction to getting something dropped on. Typically
    //      it'll try and open(thing_dropped) as if it was a file. Well, that's Firefox's behaviour at least.
    const dragAndDropState = {
        draggedTab: null, // element: tab being dragged
        nearestTab: null, // element: neighbouring tab when user 'drops'
        position: null, // string: [left|right] relative position to neighbour (to the left or right of neighbour)
        inDropZone: false // boolean: used when user drops in an out-of-bounds area.
    };
    const fakeBlueTab = document.createElement("li");
    fakeBlueTab.setAttribute("class", "tab");
    fakeBlueTab.setAttribute("id", "aasm-indication-tab");
    fakeBlueTab.style.backgroundColor = "rgba(0, 150, 220, 0.19)";
    fakeBlueTab.style.position = "relative";
    fakeBlueTab.style.pointerEvents = "none";

    const _on_drag_start = (event) => {
        fakeBlueTab.style.width = event.target.getBoundingClientRect().width; // set indication tab's width
        event.dataTransfer.effectAllowed = "move"; // allows 'move' cursor to be set in _on_drag_over()
        dragAndDropState.draggedTab = event.target; // save reference to tab being dragges
        const blankCanvas = document.createElement('canvas');
        event.dataTransfer.setDragImage(blankCanvas, 0, 0); // remove "ghost image" from cursor
        // Tab being dragged should now disappear from view.
        // Modifying the dom here causes Edge to glitch-out unless wrapped in a setTimeout().
        // The workaround below is courtesy of: https://stackoverflow.com/a/20734159
        setTimeout(() => {
            event.target.parentNode.removeChild(event.target);
        }, 0);

        // Edge incorrectly fires _on_drag_end() when hovering over child elements with pointer events, like our close-icon [x]
        // Fix courtesy of: https://stackoverflow.com/a/14027995
        const children = document.querySelectorAll("li.tab div");
        for (let c of children) { c.style.pointerEvents = "none"; } // will be undone in _on_drop()
    };

    const _on_drag_over = (event) => {
        event.dataTransfer.dropEffect = "move";
        // Indicate the new position while we drag the tab.
        // This is done by inserting a fake, blue tab somewhere. To work out where, we find which tab the
        // mouse is currently nearest to, then figure out which side (left or right). We also store this
        // information for later, we need it when the user drops a tab, i.e., lets go

        // mouse is nearest to which tab?
        let nearestTab;
        let mouseDistanceMinimum = Number.MAX_SAFE_INTEGER; // arbitrarily large initial condition
        const tabs = document.querySelectorAll("li[tabindex='1']"); // all tabs that aren't the fake blue one
        for (let t of tabs)
        {
            const tabDimensions = t.getBoundingClientRect();
            const middle = tabDimensions.x + tabDimensions.width / 2; // only x dimension matters.
            const mouseDistanceFromCurrentTab = Math.abs(event.clientX - middle);
            if (mouseDistanceFromCurrentTab < mouseDistanceMinimum) {
                mouseDistanceMinimum = mouseDistanceFromCurrentTab;
                nearestTab = t;
            }
        }

        // mouse to the left or right of nearestTab?
        let position;
        const tabDimensions = nearestTab.getBoundingClientRect();
        const mouseDistanceFromLeft = Math.abs(event.clientX - tabDimensions.left);
        const mouseDistanceFromRight = Math.abs(event.clientX - tabDimensions.right);

        // insert fake, blue tab
        if (mouseDistanceFromLeft < mouseDistanceFromRight) {
            position = "left";
            nearestTab.insertAdjacentElement('beforebegin', fakeBlueTab);
        }

        if (mouseDistanceFromRight < mouseDistanceFromLeft) {
            position = "right";
            nearestTab.insertAdjacentElement('afterend', fakeBlueTab);
        }

        // store position and nearest tab for drop event
        dragAndDropState.nearestTab = nearestTab;
        dragAndDropState.position = position;
        event.preventDefault();
    };

    const _on_drop = (event) => {
        // remove fake, blue tab
        const e = document.getElementById("aasm-indication-tab");
        e.parentNode.removeChild(e);

        // insert real tab
        if (dragAndDropState.position === "left") {
            dragAndDropState.nearestTab.insertAdjacentElement('beforebegin', dragAndDropState.draggedTab);
        }

        if (dragAndDropState.position === "right") {
            dragAndDropState.nearestTab.insertAdjacentElement('afterend', dragAndDropState.draggedTab);
        }

        // undo Edge hack (makes 'close' icons [x] clickable again)
        const children = document.querySelectorAll("li.tab div");
        for (let c of children) { c.style.pointerEvents = "inherit"; }
        event.preventDefault();
    };

    const _on_drag_end = (event) => {
        // if user let go out of bounds, add tab back to dom and remove fake, blue tab
        if (!document.body.contains(dragAndDropState.draggedTab)) {
            document.querySelector("ul.inner-tab-view").appendChild(dragAndDropState.draggedTab);
            const fakeTab = document.getElementById("aasm-indication-tab");
            fakeTab.parentNode.removeChild(fakeTab);
        }
        // animate tab back into view
        dragAndDropState.draggedTab.classList.add('animate__animated', 'animate__slideInUp');
        dragAndDropState.draggedTab.addEventListener("animationend", function _tabAdded(event) {
            dragAndDropState.draggedTab.classList.remove('animate__animated', 'animate__slideInUp');
            dragAndDropState.draggedTab.removeEventListener("animationend", _tabAdded);
        });
        event.preventDefault();
    };

    const enable_tab_reordering_ = () => {
        const tabs = document.querySelectorAll("li.tab");
        for (let t of tabs) {
            t.setAttribute("draggable", "true");
            t.addEventListener("dragend", _on_drag_end);
        }
        const dropzone = document.querySelector(".outer-tab-view");
        dropzone.addEventListener("dragstart", _on_drag_start);
        dropzone.addEventListener("dragover", _on_drag_over);
        dropzone.addEventListener("drop", _on_drop);
    };

    const disable_tab_reordering_ = () => {
        const dropzone = document.querySelector(".outer-tab-view");
        dropzone.removeEventListener("dragstart", _on_drag_start);
        dropzone.removeEventListener("dragover", _on_drag_over);
        dropzone.removeEventListener("drop", _on_drop);
        const tabs = document.querySelectorAll("li.tab");
        for (let t of tabs) {
            t.removeAttribute("draggable");
            t.removeEventListener("dragend", _on_drag_end);
        }
    };

    /*
             _           _       _     _             _   _
    __ _  __| |_ __ ___ (_)_ __ (_)___| |_ _ __ __ _| |_(_)_   _____
   / _` |/ _` | '_ ` _ \| | '_ \| / __| __| '__/ _` | __| \ \ / / _ \
  | (_| | (_| | | | | | | | | | | \__ \ |_| | | (_| | |_| |\ V /  __/
   \__,_|\__,_|_| |_| |_|_|_| |_|_|___/\__|_|  \__,_|\__|_| \_/ \___|

   */

   /*----------------------------------
    ||    LOG USE OF THIS TOOL
    ---------------------------------------------------------*/
    // Sends timestamp of usage to RESTful API server
    const log_usage = () => {
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
            'userAgent': navigator.userAgent,
        };

        GM_xmlhttpRequest({
            method: 'POST',
            url: APIURL,
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify(payload),
            onload: function (response) {
                // new verson available? advertise update by 'revealing' update button
                if (AASMVERSION < JSON.parse(response.responseText).version) {
                    document.querySelector("#btn-update").style.display = "block";
                }
            }
        });
    };
    log_usage();

    /*----------------------------------
    ||    ADVERTISE UPDATE
    ---------------------------------------------------------*/
    // Advertise update if one is available. This works by 'wobbling' an update button using the animate.css library every so often.
    // The button itself will be displayed (css: display === "block") when an this script version is behind -see log_usage() function for more info on how that works.
    const advertise_update = () => {
        const btn = document.querySelector("#btn-update");
        if (btn.style.display === "none") {
            return;
        }

        // now wobble the update button every n milliseconds
        setInterval( () => {
            btn.style.visibility = "none";
            btn.classList.add('animate__animated', 'animate__rubberBand');
            btn.style.visibility = "";
            btn.addEventListener("animationend", function _wobbleFinished(event) {
                btn.classList.remove('animate__animated', 'animate__rubberBand');
                btn.removeEventListener("animationend", _wobbleFinished);
            });
        }, 30000); // 5 minutes; we want to be subtle not aggressive
    };

    /*----------------------------------
    ||    DAEMON
    ---------------------------------------------------------*/
    const augmented_asm_daemon = () => {
        if (darkModeIsOn) {
            modify_all_documents_(window.top.frames, add_stylesheet, darkModeElement)
            modify_all_documents_(window.top.frames, add_stylesheet, darkModeTintStyleElement)
            modify_all_documents_(window.top.frames, move_element_to_last_place, darkModeElement)
        }

        // `Augment` button off? Go no further
        if (!augmentIsOn)
        {
            try {disable_tab_reordering_()} catch {null}
            return;
        };

        // apply readability mode for any new tabs.
        try {readability_mode_(true)} catch {null}
        if (darkModeIsOn) {
            try {modify_all_documents_(window.top.frames, move_element_to_second_last_place, readabilityModeElement)} catch{null}
        }
        if (!darkModeIsOn) {
            try {modify_all_documents_(window.top.frames, move_element_to_last_place, readabilityModeElement)} catch{null}
        }

        // apply sliders to any new tabs
        try {_adjust_tab_content_size_()} catch {null}
        try {_adjust_tab_width_()} catch {null}
        try {_adjust_row_height_()} catch {null}


        // apply enable pasting into emails.
        try {enable_paste_image_()} catch {null}

        // apply snap and search buttons
        try {add_finger_and_search_icons_()} catch {null}

        // apply fire button (clear search)
        try {add_fire_()} catch {null}

        // apply tab reordering
        try {enable_tab_reordering_()} catch {null}
    }

    // kick daemon off by calling function every n milliseconds
    setInterval(augmented_asm_daemon, 500);

    // advertise update
    advertise_update();

    // Turn on initially
    _augment();

})();