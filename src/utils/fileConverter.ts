export const base64ToBlob = async (base64Data: string): Promise<Blob> => {
	const res = await fetch(base64Data);
	const blob = await res.blob();
	return blob;
};
