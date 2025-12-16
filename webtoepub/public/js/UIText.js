"use strict";

/**
 * Centralized UI text constants
 * User-facing text that needs to be localized should be defined here for easier management
 * Uses getters for lazy evaluation (messages may not be loaded at class definition time)
 */
class UIText { // eslint-disable-line no-unused-vars
    // Chapter-related text
    static get Chapter() {
        return {
            get tooltipChapterDownloading() { return chrome.i18n.getMessage("__MSG_Tooltip_chapter_downloading__"); },
            get tooltipChapterDownloaded() { return chrome.i18n.getMessage("__MSG_Tooltip_chapter_downloaded__"); },
            get tooltipChapterSleeping() { return chrome.i18n.getMessage("__MSG_Tooltip_chapter_sleeping__"); },
            get tooltipChapterPreviouslyDownloaded() { return chrome.i18n.getMessage("__MSG_Tooltip_chapter_previously_downloaded__"); },
            maxChaptersSelected: (selectedCount, maxChapters) => chrome.i18n.getMessage("__MSG_More_than_max_chapters_selected__", [selectedCount, maxChapters]),
            get shiftClickMessage() { return chrome.i18n.getMessage("__MSG_Shift_Click__"); }
        };
    }

    // Library-related text
    static get Library() {
        return {
            get deleteEpub() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Delete_EPUB__"); },
            get searchNewChapter() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Search_new_Chapters__"); },
            get updateNewChapter() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Update_new_Chapters__"); },
            get download() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Download_EPUB__"); },
            get newChapter() { return chrome.i18n.getMessage("__MSG_label_Lib_Template_New_Chapter__"); },
            get storyURL() { return chrome.i18n.getMessage("__MSG_label_Lib_Template_Story_URL__"); },
            get filename() { return chrome.i18n.getMessage("__MSG_label_Lib_Template_Filename__"); },
            get updateAll() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Update_All__"); },
            get clearLibrary() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Clear_Library__"); },
            get exportLibrary() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Export_Library__"); },
            get importLibrary() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Import_Library__"); },
            get addToLibrary() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Add_List_To_Library__"); },
            get mergeUpload() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Add_Chapter_from_different_EPUB__"); },
            get editMetadata() { return chrome.i18n.getMessage("__MSG_button_Lib_Template_Edit_Metadata__"); },
            get warningURLChange() { return chrome.i18n.getMessage("__MSG_label_Lib_Template_Warning_URL_Change__"); },
            get warningInProgress() { return chrome.i18n.getMessage("__MSG_label_Lib_Warning_In_Progress___"); },
            get confirmClearLibrary() { return chrome.i18n.getMessage("__MSG_confirm_Clear_Library__"); }
        };
    }

    // Metadata-related text
    static get Metadata() {
        return {
            get title() { return chrome.i18n.getMessage("__MSG_label_Title__"); },
            get author() { return chrome.i18n.getMessage("__MSG_label_Author__"); },
            get language() { return chrome.i18n.getMessage("__MSG_label_Language__"); },
            get subject() { return chrome.i18n.getMessage("__MSG_label_Metadata_subject__"); },
            get description() { return chrome.i18n.getMessage("__MSG_label_Metadata_description__"); },
            get save() { return chrome.i18n.getMessage("__MSG_label_Metadata_Save__"); }
        };
    }

    // Common UI elements
    static get Common() {
        return {
            get ok() { return chrome.i18n.getMessage("__MSG_button_error_OK__"); },
            get cancel() { return chrome.i18n.getMessage("__MSG_button_error_Cancel__"); },
            get retry() { return chrome.i18n.getMessage("__MSG_button_error_Retry__"); },
            get help() { return chrome.i18n.getMessage("__MSG_button_Help__"); },
            get remove() { return chrome.i18n.getMessage("__MSG_button_Remove__"); },
            get skip() { return chrome.i18n.getMessage("__MSG_button_error_Skip__"); },
            get addToLibrary() { return chrome.i18n.getMessage("__MSG_button_Add_to_Library__"); }
        };
    }


    // Error messages
    static get Error() {
        return {
            get noParserFound() { return chrome.i18n.getMessage("noParserFound"); },
            get noChaptersFound() { return chrome.i18n.getMessage("noChaptersFound"); },
            get noChaptersFoundAndFetchClicked() { return chrome.i18n.getMessage("noChaptersFoundAndFetchClicked"); },
            get noImagesFound() { return chrome.i18n.getMessage("noImagesFound"); },
            get unhandledFieldTypeError() { return chrome.i18n.getMessage("unhandledFieldTypeError"); },
            errorContentNotFound: (url) => chrome.i18n.getMessage("errorContentNotFound", [url]),
            errorIllegalFileName: (filename, illegalChars) => chrome.i18n.getMessage("errorIllegalFileName", [filename, illegalChars]),
            get errorEditMetadata() { return chrome.i18n.getMessage("errorEditMetadata"); },
            get errorAddToLibraryLibraryAddPageWithChapters() { return chrome.i18n.getMessage("errorAddToLibraryLibraryAddPageWithChapters"); },
            htmlFetchFailed: (url, error) => chrome.i18n.getMessage("htmlFetchFailed", [url, error]),
            imageFetchFailed: (url, parentUrl, error) => chrome.i18n.getMessage("imageFetchFailed", [url, parentUrl, error]),
            imgurFetchFailed: (url, parentUrl, error) => chrome.i18n.getMessage("imgurFetchFailed", [url, parentUrl, error]),
            gotHtmlExpectedImageWarning: (url) => chrome.i18n.getMessage("gotHtmlExpectedImageWarning", [url]),
            convertToXhtmlWarning: (filename, url, errorMessage) => chrome.i18n.getMessage("convertToXhtmlWarning", [filename, url, errorMessage])
        };
    }

    // Warning messages
    static get Warning() {
        return {
            get warningNoChapterUrl() { return chrome.i18n.getMessage("warningNoChapterUrl"); },
            warningNoVisibleContent: (url) => chrome.i18n.getMessage("warningNoVisibleContent", [url]),
            warning403ErrorResponse: (hostname) => chrome.i18n.getMessage("warning403ErrorResponse", [hostname]),
            warning429ErrorResponse: (hostname) => chrome.i18n.getMessage("warning429ErrorResponse", [hostname]),
            get warningParserDisabledComradeMao() { return chrome.i18n.getMessage("warningParserDisabledComradeMao"); },
            get parserDisabledNotification() { return chrome.i18n.getMessage("parserDisabledNotification"); },
            get httpFetchCanRetry() { return chrome.i18n.getMessage("httpFetchCanRetry"); },
            warningWebpImage: (relativeHref) => chrome.i18n.getMessage("warningWebpImage", [relativeHref])
        };
    }

    // Default/Placeholder text
    static get Default() {
        return {
            get uuid() { return chrome.i18n.getMessage("defaultUUID"); },
            get title() { return chrome.i18n.getMessage("defaultTitle"); },
            get author() { return chrome.i18n.getMessage("defaultAuthor"); },
            chapterPlaceholderMessage: (title, url) => chrome.i18n.getMessage("chapterPlaceholderMessage", [title, url]),
            get informationPageTitle() { return chrome.i18n.getMessage("informationPageTitle"); },
            get tableOfContentsUrl() { return chrome.i18n.getMessage("tableOfContentsUrl"); }
        };
    }

    // Cover image related text
    static get CoverImage() {
        return {
            get noImagesFoundLabel() { return chrome.i18n.getMessage("noImagesFoundLabel"); },
            get setCover() { return chrome.i18n.getMessage("setCover"); }
        };
    }

    // HTTP Client specific messages
    static get HttpClient() {
        return {
            get makeFailCanRetryMessage() { return chrome.i18n.getMessage("httpFetchCanRetry"); }
        };
    }

    // Utility method for localizing UI elements
    static localizeElement(element) {
        let key = element.textContent.trim();
        let localized = chrome.i18n.getMessage(key);
        if (!util.isNullOrEmpty(localized) && localized !== key) {
            element.textContent = localized;
        }
    }
}