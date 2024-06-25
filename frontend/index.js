var options;

var currentChoice;
var currentPane = 'flag1';

var flagPaneScroll = {};

var noFlagEl;
var optionsEl;
var flagOptionsEl;
var clipOptionsEl;
var overlayOptionsEl;
var finalBadgeEl;
var settingsButtons;

var exportType = 'png';

const baseUrl = 'http://localhost:8787';

async function init() {
    noFlagEl = document.getElementById('no-flag');
    optionsEl = document.getElementById('options');
    flagOptionsEl = document.getElementById("flag-options");
    clipOptionsEl = document.getElementById("clip-options");
    overlayOptionsEl = document.getElementById("overlay-options");
    finalBadgeEl = document.getElementById("final-badge");
    settingsButtons = document.querySelectorAll("#settings .setting");

    let res = await fetch(baseUrl + "/options.json");
    options = await res.json();

    document.getElementById('dummy-flag').remove();
    options.flags.forEach((flag) => {
        let img = document.createElement("img");
        img.setAttribute("class", "flag");
        img.setAttribute("id", flag);
        img.src = baseUrl + `/88x31/${flag}.png`;
        flagOptionsEl.append(img);
    });

    currentChoice = {
        flag2: options.flags[1],
        clip: options.clips[0],
        overlay: options.overlays[0]
    };

    await selectOption(options.flags[0]);
    await refreshView();

    optionsEl.addEventListener('click', async function (event) {
        if (event.target && event.target.tagName === 'IMG') {
            await selectOption(event.target.id);
        }
    });

    document.getElementById('settings').addEventListener('click', async function (event) {
        if (event.target && event.target.classList.contains('setting')) {
            await switchPane(event.target.id);
        }
    });

    document.getElementById('svg').addEventListener('click', async function (event) {
        exportType = 'svg';
        await refreshExport();
    });

    document.getElementById('png').addEventListener('click', async function (event) {
        exportType = 'png';
        await refreshExport();
    });
}

function paneToElement(pane) {
    switch (pane) {
        case 'flag1':
            return flagOptionsEl;
        case 'flag2':
            return flagOptionsEl;
        case 'clip':
            return clipOptionsEl;
        case 'overlay':
            return overlayOptionsEl;
    }
}

function choiceToUrl(choice, ext) {
    let url = baseUrl + `/88x31/${choice.flag1}`;
    if (choice.flag2 && choice.flag2 !== 'no-flag') {
        url += `/${choice.flag2}`;
        if (choice.clip) {
            url += `/${choice.clip}`;
        }
    }
    if (choice.overlay && choice.overlay !== 'no-overlay') {
        url += `/${choice.overlay}`;
    }
    url += `.${ext}`;
    return url;
}

async function switchPane(pane) {
    if (pane === currentPane) {
        return;
    }

    if (currentPane.slice(0, -1) === 'flag') {
        flagPaneScroll[currentPane] = flagOptionsEl.scrollTop;
        let focusedFlag = currentChoice[currentPane];
        if (focusedFlag) {
            document.getElementById(focusedFlag).classList.remove('focused');
        }
    }
    if (pane.slice(0, -1) === 'flag') {
        flagOptionsEl.scrollTop = flagPaneScroll[pane] ?? 0;
        let focusedFlag = currentChoice[pane];
        if (focusedFlag) {
            document.getElementById(focusedFlag).classList.add('focused');
        }
    }
    if (pane === 'flag2') {
        noFlagEl.classList.remove('hidden');
    } else {
        noFlagEl.classList.add('hidden');
    }

    settingsButtons.forEach((button) => {
        if (button.id === pane) {
            button.classList.add('active');
        }
        if (button.id === currentPane) {
            button.classList.remove('active');
        }
    });

    paneToElement(currentPane).classList.add('hidden');
    paneToElement(pane).classList.remove('hidden');

    currentPane = pane;
}

async function selectOption(option) {
    let currentOption = currentChoice[currentPane];
    if (currentOption === option) {
        return;
    }
    if (currentOption) {
        document.getElementById(currentOption).classList.remove('focused');
    }
    currentChoice[currentPane] = option;
    document.getElementById(option).classList.add('focused');
    if (currentPane === 'flag2') {
        document.querySelector('#settings #clip').disabled = option === 'no-flag';
    }
    await refreshView();
}

async function refreshView() {
    if (currentPane !== 'clip') {
        clipOptionsEl.innerHTML = '';
        options.clips.forEach((clip) => {
            let choice = { ...currentChoice };
            choice.clip = clip;
            let img = document.createElement("img");
            img.setAttribute("class", "flag");
            img.setAttribute("id", clip);
            if (clip === currentChoice.clip) {
                img.classList.add('focused');
            }
            img.src = choiceToUrl(choice, 'png');
            clipOptionsEl.append(img);
        });
    }
    if (currentPane !== 'overlay') {
        overlayOptionsEl.innerHTML = '';
        let overlays = options.overlays.slice();
        overlays.unshift('no-overlay');
        overlays.forEach((overlay) => {
            let choice = { ...currentChoice };
            choice.overlay = overlay;
            let img = document.createElement("img");
            img.setAttribute("class", "flag");
            img.setAttribute("id", overlay);
            if (overlay === currentChoice.overlay) {
                img.classList.add('focused');
            }
            img.src = choiceToUrl(choice, 'png');
            overlayOptionsEl.append(img);
        });
    }
    finalBadgeEl.src = choiceToUrl(currentChoice, 'png');
    await refreshExport();
}

async function refreshExport() {
    let url = choiceToUrl(currentChoice, exportType);
    let title = currentChoice.flag1;
    if (currentChoice.flag2 !== 'no-flag') {
        title += ` ${currentChoice.flag2}`;
    }
    document.getElementById("html-textarea").value = `<a href="https://badge.les.bi"><img title="${title}" ${exportType === 'png' ? 'style="image-rendering: pixelated;"' : ''} src="${url}"></a>`;
}

document.addEventListener("DOMContentLoaded", init);