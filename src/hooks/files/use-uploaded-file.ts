/** @format */

import { useState, useCallback } from "react";
import { db } from "@/lib/db/db";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import { useAuthContext } from "@/components/auth/auth-provider";

type InstantFile = InstaQLEntity<AppSchema, "$files">;

interface UploadFileOptions {
    contentType?: string;
    contentDisposition?: string;
}

interface UseUploadedFileResult {
    file: InstantFile | null;
    isLoading: boolean;
    error: string | null;
    uploadFile: (
        file: File,
        path?: string,
        options?: UploadFileOptions
    ) => Promise<InstantFile | null>;
}

export function useUploadedFile(): UseUploadedFileResult {
    const [file, setFile] = useState<InstantFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthContext();

    const uploadFile = useCallback(
        async (
            fileToUpload: File,
            filePath?: string,
            uploadOptions?: UploadFileOptions
        ): Promise<InstantFile | null> => {
            setIsLoading(true);
            setError(null);
            setFile(null);

            try {
                // 1. Upload the file
                const finalPath = filePath || fileToUpload.name;
                const { data: uploadData } = await db.storage.uploadFile(
                    finalPath,
                    fileToUpload,
                    {
                        contentType:
                            uploadOptions?.contentType || fileToUpload.type,
                        contentDisposition: uploadOptions?.contentDisposition,
                    }
                );

                // 2. Get the returned ID
                const fileId = uploadData?.id;
                if (!fileId) {
                    throw new Error("Upload failed: No file ID returned");
                }

                // 3. Link the file to the user
                if (user?.id) {
                    await db.transact([
                        db.tx.$files[fileId].link({ owner: user.id }),
                    ]);
                }

                // 4. Query for the file by ID
                const { data: queryData } = await db.queryOnce({
                    $files: { $: { where: { id: fileId } } },
                });
                const fileData = queryData?.$files?.[0];

                if (!fileData) {
                    throw new Error("Failed to retrieve uploaded file data");
                }

                // 5. Return the file
                setFile(fileData);
                setIsLoading(false);
                return fileData;
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : "Failed to upload file";
                setError(errorMessage);
                setIsLoading(false);
                return null;
            }
        },
        [user?.id]
    );

    return {
        file,
        isLoading,
        error,
        uploadFile,
    };
}
