export interface LogbookFormData {
	tanggal: string;
	deskripsi: string;
	luaran: string;
	image?: File | null;
}

export interface DriveStatusResult {
	configured: boolean;
	fileId: string | null;
	clientEmailConfigured: boolean;
	privateKeyConfigured: boolean;
	statusText: string;
	details: string;
}

export interface DocxStatusResult {
	configured: boolean;
	statusText: string;
	details: string;
}

export interface SystemStatus {
	drive: DriveStatusResult;
	docx: DocxStatusResult;
	isReady: boolean;
}

export interface ApiResponse {
	success: boolean;
	message: string;
	details?: string;
	driveConfigured: boolean;
	docxConfigured: boolean;
	data?: {
		tanggal?: string;
		deskripsi?: string;
		luaran?: string;
		deskripsiLength?: number;
		hasImage?: boolean;
		imageName?: string;
		imageSize?: number;
	};
}


export interface ToastMessage {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	title: string;
	message: string;
	duration?: number;
}
