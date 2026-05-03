import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get('audio') as File | null;
    const mode = (form.get('mode') as string) || 'grocery';

    if (!audio) {
      return NextResponse.json({ error: 'No audio' }, { status: 400 });
    }

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'nl',
    });

    const text = transcription.text.trim();
    if (!text) {
      return NextResponse.json({ error: 'Geen tekst herkend', transcript: '' }, { status: 422 });
    }

    // Parse with GPT-4o-mini
    let systemPrompt: string;

    if (mode === 'grocery') {
      systemPrompt = `Je bent een boodschappenlijst-parser voor een camping app.
Zet de ingesproken boodschappenlijst om naar JSON.
Output ALTIJD: { "items": [{ "name": "...", "quantity": "..." }] }
- name: duidelijke productnaam in het Nederlands, met hoofdletter
- quantity: hoeveelheid als string (bijv. "6", "1 pak", "500g"), weglaten als niet genoemd
- Splits combinaties op ("3 eieren en melk" → twee items)
- Verwijder stopwoorden ("en ook nog", "ik heb nodig", etc.)`;
    } else {
      // mode === 'item' (paklijst beheer)
      systemPrompt = `Je bent een camping-paklijst parser.
Zet de ingesproken item-beschrijving om naar JSON voor een paklijst.
Output ALTIJD: { "name": "...", "category": "...", "tripTypes": [...], "mountains": false, "kids": false, "quantity": "", "notes": "" }

Regels:
- name: naam van het item, met hoofdletter
- category: kies uit: Kleding, Slaap, Keuken & Eten, Hygiëne, Kinderen, EHBO, Navigatie & Kaarten, Gereedschap, Bergen, Overig
- tripTypes: array van "dag", "weekend", "week" — standaard alle drie tenzij anders gezegd
  - "alleen dag" → ["dag"]
  - "weekend+" of "dag+" → ["dag","weekend"]
  - "week+" of "langer" → ["dag","weekend","week"]
- mountains: true alleen als specifiek voor bergen/hiking
- kids: true alleen als specifiek voor kinderen
- quantity: hoeveelheid als string, leeg als niet gezegd
- notes: extra notitie, leeg als niet gezegd`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(raw);

    return NextResponse.json({ transcript: text, ...parsed });
  } catch (err) {
    console.error('Voice API error:', err);
    return NextResponse.json({ error: 'Server fout' }, { status: 500 });
  }
}
