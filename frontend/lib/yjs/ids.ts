const DOCUMENT_ID_SEPARATOR = "::";

export const createDocumentId = (workspaceId: string, fileId: string): string => {
  return `${workspaceId}${DOCUMENT_ID_SEPARATOR}${fileId}`;
};

export const parseDocumentId = (documentId: string) => {
  const separatorIndex = documentId.indexOf(DOCUMENT_ID_SEPARATOR);
  if (separatorIndex === -1) {
    return null;
  }

  const workspaceId = documentId.slice(0, separatorIndex).trim();
  const fileId = documentId.slice(separatorIndex + DOCUMENT_ID_SEPARATOR.length).trim();

  if (!workspaceId || !fileId) {
    return null;
  }

  return { workspaceId, fileId };
};
