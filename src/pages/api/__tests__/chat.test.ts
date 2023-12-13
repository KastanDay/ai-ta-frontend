// src/pages/api/__tests__/chat.test.ts
import { handler } from '../chat.ts';
import { NextResponse } from 'next/server';
import { OpenAIStream } from '@/utils/server';

describe('handler', () => {
  it('returns correct response for valid chat request', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        model: { id: 'gpt-3' },
        messages: [],
        key: 'test-key',
        prompt: 'test-prompt',
        temperature: 0.5,
        course_name: 'test-course',
        stream: false,
      }),
    };

    const mockOpenAIStream = jest.spyOn(OpenAIStream, 'default');
    mockOpenAIStream.mockResolvedValue('test-response');

    const response = await handler(mockReq as any);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.body).toEqual('test-response');
  });

  it('throws error for invalid chat request', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({}),
    };

    await expect(handler(mockReq as any)).rejects.toThrow();
  });

  it('correctly parses and encodes message from chat request', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        model: { id: 'gpt-3' },
        messages: [{ content: 'test-message' }],
        key: 'test-key',
        prompt: 'test-prompt',
        temperature: 0.5,
        course_name: 'test-course',
        stream: false,
      }),
    };

    const mockOpenAIStream = jest.spyOn(OpenAIStream, 'default');
    mockOpenAIStream.mockResolvedValue('test-response');

    await handler(mockReq as any);

    expect(mockOpenAIStream).toHaveBeenCalledWith(
      { id: 'gpt-3' },
      'test-promptOnly answer if it\'s related to the course materials.',
      0.5,
      'test-key',
      [{ content: 'test-message' }],
      false,
    );
  });

  // Additional test cases to cover all branches of the code...
});
