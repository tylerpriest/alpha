/*
  Parses files on www.royalroadl.com
*/
"use strict";

parserFactory.register("royalroadl.com", () => new RoyalRoadParser());
parserFactory.register("royalroad.com", () => new RoyalRoadParser());

class RoyalRoadParser extends Parser {
    constructor() {
        super();
        this.startingChapterUrl = null;
    }

    // WEB-MOD: Convert chapter URL to fiction URL, store chapter for later
    getFictionUrl(url) {
        const chapterMatch = url.match(/^(https?:\/\/www\.royalroad\.com\/fiction\/\d+\/[^/]+)\/chapter\//);
        if (chapterMatch) {
            this.startingChapterUrl = url;
            return chapterMatch[1];
        }
        return url;
    }

    async getChapterUrls(dom) {
        // Page in browser has links reduced to "Number of links to show"
        // WEB-MOD: Use fiction URL (converted from chapter URL if needed)
        let fictionUrl = this.getFictionUrl(dom.baseURI);
        let tocHtml = (await HttpClient.wrapFetch(fictionUrl)).responseXML;
        let table = tocHtml.querySelector("table#chapters");
        return util.hyperlinksToChapterList(table);
    }

    // find the node(s) holding the story content
    findContent(dom) {
        let content = util.getElement(dom, "div", 
            e => (e.className === "portlet-body") &&
            (e.querySelector("div.chapter-inner") !== null)
        );
        return content || dom.querySelector(".page-content-wrapper");
    }

    populateUIImpl() {
        document.getElementById("removeAuthorNotesRow").hidden = false;

        // WEB-MOD: If started from chapter URL, set range to start from that chapter
        if (this.startingChapterUrl) {
            this.setStartingChapter();
            this.addQuickSelectButtons();
        }
    }

    // WEB-MOD: Find and select the starting chapter in the dropdown
    setStartingChapter() {
        let rangeStart = document.getElementById("rangeStartChapter");
        let rangeEnd = document.getElementById("rangeEndChapter");
        if (!rangeStart || !rangeEnd || !this.startingChapterUrl) return;

        // Extract chapter ID from URL (the number after /chapter/)
        let chapterIdMatch = this.startingChapterUrl.match(/\/chapter\/(\d+)/);
        if (!chapterIdMatch) return;
        let chapterId = chapterIdMatch[1];

        // Find the chapter in the table by matching chapter ID in URL
        let rows = [...document.querySelectorAll("#chapterUrlsTable tr")].filter(r => !r.querySelector("th"));
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            // The URL is in the last cell (hidden) or we can check the chapter object
            let cells = row.querySelectorAll("td");
            let urlCell = cells[cells.length - 1];
            let url = urlCell?.textContent || "";

            if (url.includes(`/chapter/${chapterId}`)) {
                rangeStart.selectedIndex = i;
                rangeStart.dispatchEvent(new Event('change'));
                return;
            }
        }
    }

    // WEB-MOD: Add quick chapter count buttons
    addQuickSelectButtons() {
        let rangeRow = document.getElementById("rangeStartChapterRow");
        if (!rangeRow || document.getElementById("quickSelectBtns")) return;

        let btnContainer = document.createElement("div");
        btnContainer.id = "quickSelectBtns";
        btnContainer.style.cssText = "margin-top: 8px; display: flex; gap: 8px;";

        [10, 20, 50, 100].forEach(count => {
            let btn = document.createElement("button");
            btn.textContent = `Next ${count}`;
            btn.style.cssText = "padding: 4px 12px; font-size: 14px;";
            btn.onclick = (e) => {
                e.preventDefault();
                this.selectNextChapters(count);
            };
            btnContainer.appendChild(btn);
        });

        rangeRow.appendChild(btnContainer);
    }

    // WEB-MOD: Select next N chapters from current start position
    selectNextChapters(count) {
        let rangeStart = document.getElementById("rangeStartChapter");
        let rangeEnd = document.getElementById("rangeEndChapter");
        if (!rangeStart || !rangeEnd) return;

        let startIdx = rangeStart.selectedIndex;
        let endIdx = Math.min(startIdx + count - 1, rangeEnd.options.length - 1);

        rangeEnd.selectedIndex = endIdx;
        rangeEnd.dispatchEvent(new Event('change'));
    }

    preprocessRawDom(webPageDom) { 
        this.removeWatermarks(webPageDom);
        this.removeImgTagsWithNoSrc(webPageDom);
        this.tagAuthorNotesBySelector(webPageDom, "div.author-note-portlet");

        let re_cnRandomClass = new RegExp("^cn[A-Z][a-zA-Z0-9]{41}$");
        webPageDom.querySelectorAll("p").forEach(element =>
        {
            let className = Array.from(element.classList).filter(item => re_cnRandomClass.test(item))[0];
            if (className)
            {
                element.classList.remove(className);
            }
        }
        );
    }

    //watermarks are regular <p> elements set to "display: none" by internal css
    removeWatermarks(webPageDom) {
        let internalStyles = [...webPageDom.querySelectorAll("style")]
            .map(style => style.sheet?.rules);
        let allCssRules = [];
        for (let ruleList of internalStyles) {
            for (let rule of ruleList) {
                allCssRules.push(rule);
            }
        }
        for (let rule of allCssRules.filter(s => s.style?.display == "none")) {
            webPageDom.querySelector(rule.selectorText)?.remove();
        }        
    }

    removeUnwantedElementsFromContentElement(content) {
        // only keep the <div class="chapter-inner" elements of content
        for (let i = content.childElementCount - 1; 0 <= i; --i) {
            let child = content.children[i];
            if (!this.isWantedElement(child)) {
                child.remove();
            }
        }
        this.makeHiddenElementsVisible(content);

        super.removeUnwantedElementsFromContentElement(content);
    }

    isWantedElement(element) {
        let tagName = element.tagName.toLowerCase();
        let className = element.className;
        return (tagName === "h1") || 
            ((tagName === "div") && 
                (className.startsWith("chapter-inner") ||
                className.includes("author-note-portlet") ||
                className.includes("page-content"))
            );
    }

    makeHiddenElementsVisible(content) {
        [...content.querySelectorAll("div")]
            .filter(e => (e.style.display === "none"))
            .forEach(e => e.removeAttribute("style"));
    }

    removeNextAndPreviousChapterHyperlinks(webPage, content) {
        util.removeElements(content.querySelectorAll("a[href*='www.royalroadl.com']"));
        RoyalRoadParser.removeOlderChapterNavJunk(content);
    }

    extractTitleImpl(dom) {
        return dom.querySelector("div.fic-header div.col h1");
    }

    extractAuthor(dom) {
        let author = dom.querySelector("div.fic-header h4 span a");
        return author?.textContent?.trim() ?? super.extractAuthor(dom);
    }

    extractSubject(dom) {
        let tags = ([...dom.querySelectorAll("div.fiction-info span.tags .label")]);
        return tags.map(e => e.textContent.trim()).join(", ");
    }

    extractDescription(dom) {
        return dom.querySelector("div.fiction-info div.description").textContent.trim();
    }

    findChapterTitle(dom) {
        return dom.querySelector("h1") ||
            dom.querySelector("h2");
    }

    static removeOlderChapterNavJunk(content) {
        // some older chapters have next chapter & previous chapter links seperated by string "<-->"
        for (let node of util.iterateElements(content, 
            n => (n.textContent.trim() === "<-->"),
            NodeFilter.SHOW_TEXT)) {
            node.remove();
        }
    }

    findCoverImageUrl(dom) {
        return dom.querySelector("img.thumbnail")?.src ?? null;
    }

    removeImgTagsWithNoSrc(webPageDom) {
        [...webPageDom.querySelectorAll("img")]
            .filter(i => util.isNullOrEmpty(i.src))
            .forEach(i => i.remove());
    }

    getInformationEpubItemChildNodes(dom) {
        return [...dom.querySelectorAll("div.fic-title, div.fiction-info div.portlet.row")];
    }
}
