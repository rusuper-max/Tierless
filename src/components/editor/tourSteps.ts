// src/components/editor/tourSteps.ts
import { TourStep } from "./GuidedTour";

export const editorTourSteps: TourStep[] = [
    {
        target: '[data-tour="save-button"]',
        title: "Save Your Work",
        content: "Click here to save your changes. Your work auto-saves periodically, but you can manually save anytime to ensure nothing is lost.",
        placement: "bottom",
    },
    {
        target: '[data-tour="preview-button"]',
        title: "Preview Your Page",
        content: "See exactly how your page looks to visitors before publishing. This opens a live preview in a modal.",
        placement: "bottom",
    },
    {
        target: '[data-tour="guide-button"]',
        title: "Interactive Guide",
        content: "Activate Guide Mode to learn what each button and field does. Your cursor becomes a question mark - just click any element for instant help!",
        placement: "bottom",
    },
    {
        target: '[data-tour="publish-button"]',
        title: "Publish Your Page",
        content: "Toggle between Draft (offline) and Online (published). When online, your page is live and accessible to visitors.",
        placement: "bottom",
    },
    {
        target: '[data-tour="editor-tabs"]',
        title: "Editor Sections",
        content: "Navigate between Content (items & sections), Business (contact info), Design (themes & layout), and Settings (advanced options).",
        placement: "bottom",
    },
    {
        target: '[data-tour="add-item"]',
        title: "Add Items",
        content: "Create new items for your menu, pricing list, or catalog. Each item can have a name, price, description, image, and more.",
        placement: "left",
    },
    {
        target: '[data-tour="theme-toggle"]',
        title: "Theme Preview",
        content: "Switch between light and dark mode to see how your page looks in different themes. Your visitors can choose their preferred theme.",
        placement: "bottom",
    },
];

export const finalTourMessage = {
    title: "You're All Set!",
    content: "You can explore more features by activating Guide Mode (click the Guide button in the navbar) and clicking on any element to see detailed explanations. Happy editing!",
};
