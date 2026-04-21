import { createClient } from '@/lib/supabase/server';
import { createAnthropicClient } from '@/lib/anthropic';
import { P1_CHAT_ONBOARDING, P2_CHAT_PERFIL } from '@/lib/prompts';
import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  mode: 'onboarding' | 'perfil';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { messages, mode } = (await request.json()) as RequestBody;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No hay mensajes' },
        { status: 400 }
      );
    }

    const anthropic = createAnthropicClient();

    // Seleccionar el prompt según el modo
    const systemPrompt = mode === 'onboarding' ? P1_CHAT_ONBOARDING : P2_CHAT_PERFIL;

    // Mensaje inicial si es la primera interacción
    let messageHistory = [...messages];
    if (messageHistory.length === 1 && mode === 'onboarding') {
      messageHistory = [
        {
          role: 'assistant' as const,
          content: 'Vamos a generar tu CV. Puedes contarme sobre tu experiencia o subir un documento (CV antiguo, LinkedIn en PDF, carta de presentación).',
        },
        ...messageHistory,
      ];
    }

    // Llamar a Claude
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150, // Máximo 2 líneas
      system: systemPrompt,
      messages: messageHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      message: assistantMessage,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      { error: 'Error en el chat' },
      { status: 500 }
    );
  }
}
