export interface ScriptPdf {
    id: number;
    versionNo: number;
    versionName?: string;
    filePath: string;
    createdAt: string;
}

export interface Drama {
    id: number;
    title: string;
    description: string;
    tags?: string;
    images?: { id: number; filePath: string; sortOrder?: number }[];
    pdfs?: ScriptPdf[];  // ✅ เพิ่ม
    createdAt: string;
    createdBy: number;
    updatedAt?: string;
    updatedBy?: number;
}
