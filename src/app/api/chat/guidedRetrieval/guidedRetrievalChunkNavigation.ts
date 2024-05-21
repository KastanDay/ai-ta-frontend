import { supabase } from '@/utils/supabaseClient'
import { ContextWithMetadata } from '~/types/chat';

// Function to navigate to the next or previous chunk of the document
export async function navigateChunk(document: ContextWithMetadata, direction: 'next' | 'previous'): Promise<ContextWithMetadata | null> {
    const currentPageNumber = parseInt(document.pagenumber);
    const nextPageNumber = direction === 'next' ? currentPageNumber + 1 : currentPageNumber - 1;

    return fetchChunkByPageNumber(document, nextPageNumber.toString());
}

// Function to fetch the previous or next chunk of the document from Supabase
export async function fetchChunkByPageNumber(document: ContextWithMetadata, pageNumber: string): Promise<ContextWithMetadata | null> {
    const docId = document.id;
    const chunkIndex = parseInt(pageNumber);

    try {
        const { data, error } = await supabase
            .from('documents')
            .select(`
                id,
                readable_filename,
                course_name,
                s3_path,
                url,
                base_url,
                contexts
            `)
            .eq('id', docId)
            .single();

        if (error) {
            console.error(`Failed to fetch document with id ${docId}:`, error);
            return null;
        }

        if (!data || !data.contexts || !Array.isArray(data.contexts) || data.contexts.length <= chunkIndex || chunkIndex < 0) {
            return null; // Return null if there is no next or previous chunk
        }

        const newChunk = data.contexts[chunkIndex];

        return {
            id: data.id,
            text: newChunk.text,
            readable_filename: data.readable_filename,
            course_name: data.course_name,
            'course_name ': data.course_name,
            s3_path: data.s3_path,
            pagenumber: chunkIndex.toString(),
            url: data.url,
            base_url: data.base_url
        };
    } catch (error) {
        console.error(`Failed to fetch the ${chunkIndex} chunk of the document:`, error);
        return null;
    }
}