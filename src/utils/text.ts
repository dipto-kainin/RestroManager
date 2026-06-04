export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

export const getFirstParagraph = (text: string): string => {
  if (!text) return '';
  return text.split(/\n\s*\n/)[0].trim();
};
