export function getImportSourceKey(file: File): string {
  const relativePath = file.webkitRelativePath.trim();

  return relativePath || file.name;
}
