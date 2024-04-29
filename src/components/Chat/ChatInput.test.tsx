import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './ChatInput';
import * as apiUtils from '~/utils/apiUtils';
import { OpenAIModelID } from '~/types/openai';

// Mock the external services/APIs
jest.mock('~/utils/apiUtils', () => ({
  fetchPresignedUrl: jest.fn(),
  uploadToS3: jest.fn(),
}));

describe('ChatInput', () => {
  // Add necessary setup and teardown logic

  it('should render the image upload button when using a vision-capable model', () => {
    render(<ChatInput 
      // Pass necessary props
      selectedConversation={{ model: { id: OpenAIModelID.GPT_4_VISION } }}
    />);
    expect(screen.getByRole('button', { name: /upload image/i })).toBeInTheDocument();
  });

  it('should not render the image upload button when using a non-vision model', () => {
    render(<ChatInput 
      // Pass necessary props  
      selectedConversation={{ model: { id: OpenAIModelID.GPT_3_5_TURBO } }}
    />);
    expect(screen.queryByRole('button', { name: /upload image/i })).not.toBeInTheDocument();
  });

  it('should handle a successful image upload', async () => {
    (apiUtils.uploadToS3 as jest.Mock).mockResolvedValueOnce('uploaded-image-url');
    (apiUtils.fetchPresignedUrl as jest.Mock).mockResolvedValueOnce('presigned-image-url');

    render(<ChatInput 
      // Pass necessary props
      selectedConversation={{ model: { id: OpenAIModelID.GPT_4_VISION } }} 
    />);

    const imageUploadInput = screen.getByTestId('image-upload-input');
    const file = new File(['image'], 'image.png', { type: 'image/png' });
    await userEvent.upload(imageUploadInput, file);

    expect(apiUtils.uploadToS3).toHaveBeenCalledWith(expect.any(File), expect.any(String));
    expect(apiUtils.fetchPresignedUrl).toHaveBeenCalledWith('uploaded-image-url');
    
    await waitFor(() => {
      expect(screen.getByAltText(/preview/i)).toHaveAttribute('src', 'presigned-image-url');
    });
  });

  it('should handle an image upload failure', async () => {
    (apiUtils.uploadToS3 as jest.Mock).mockRejectedValueOnce(new Error('upload failed'));

    render(<ChatInput 
      // Pass necessary props
      selectedConversation={{ model: { id: OpenAIModelID.GPT_4_VISION } }}
    />);

    const imageUploadInput = screen.getByTestId('image-upload-input');  
    const file = new File(['image'], 'image.png', { type: 'image/png' });
    await userEvent.upload(imageUploadInput, file);

    expect(apiUtils.uploadToS3).toHaveBeenCalledWith(expect.any(File), expect.any(String));
    expect(apiUtils.fetchPresignedUrl).not.toHaveBeenCalled();

    expect(await screen.findByText(/upload failed for file/i)).toBeInTheDocument();
  });

  // Add more test cases to cover other scenarios and edge cases
});