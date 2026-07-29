import { checkGoogleDriveStatus } from '$lib/server/google-drive';
import { checkDocxProcessingStatus } from '$lib/server/docx';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const driveStatus = checkGoogleDriveStatus();
	const docxStatus = checkDocxProcessingStatus();

	return {
		driveStatus,
		docxStatus
	};
};
