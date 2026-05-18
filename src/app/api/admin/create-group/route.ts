import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { Group } from '@/lib/types';

export const runtime = 'nodejs';

const WORDS = ['BERG', 'TENT', 'KAMP', 'BOOM', 'VUUR', 'PAD', 'TOP', 'MEER', 'WIND', 'ROTS'];

function genInviteCode(): string {
  const w = WORDS[Math.floor(Math.random() * WORDS.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}-${n}`;
}

function genGroupId(): string {
  return 'g-' + Math.random().toString(36).slice(2, 8);
}

export async function POST(req: NextRequest) {
  // Validate admin PIN
  const expectedPin = process.env.ADMIN_PIN;
  if (!expectedPin) {
    return NextResponse.json({ error: 'Server misconfigured: ADMIN_PIN not set' }, { status: 500 });
  }

  let body: { adminPin?: string; groupName?: string; memberName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { adminPin, groupName, memberName } = body;
  if (!adminPin || adminPin !== expectedPin) {
    return NextResponse.json({ error: 'Onjuiste admin-PIN' }, { status: 401 });
  }
  if (!groupName?.trim() || !memberName?.trim()) {
    return NextResponse.json({ error: 'Groepsnaam en jouw naam zijn verplicht' }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    // Pick a unique id + code (collision is extremely unlikely but cheap to guard)
    let id = genGroupId();
    for (let i = 0; i < 5; i++) {
      const snap = await db.collection('groups').doc(id).get();
      if (!snap.exists) break;
      id = genGroupId();
    }

    let inviteCode = genInviteCode();
    for (let i = 0; i < 5; i++) {
      const dup = await db.collection('groups').where('inviteCode', '==', inviteCode).limit(1).get();
      if (dup.empty) break;
      inviteCode = genInviteCode();
    }

    const group: Group = {
      id,
      name: groupName.trim(),
      inviteCode,
      members: [memberName.trim()],
      createdAt: Date.now(),
    };

    await db.collection('groups').doc(id).set(group);

    return NextResponse.json({ group });
  } catch (err) {
    console.error('create-group API failed:', err);
    const msg = err instanceof Error ? err.message : 'Onbekende fout';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
