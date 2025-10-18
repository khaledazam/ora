import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log('Webhook payload received at', new Date().toISOString(), ':', payload); // للـ debugging
    const heads = headers();

    const svix_id = heads.get('svix-id');
    const svix_timestamp = heads.get('svix-timestamp');
    const svix_signature = heads.get('svix-signature');

    console.log('Webhook headers at', new Date().toISOString(), ':', { svix_id, svix_timestamp, svix_signature });

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing webhook headers at', new Date().toISOString());
      return new Response(JSON.stringify({ ok: false, message: 'Invalid signature headers' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const svix = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
    let evt;

    try {
      evt = svix.verify(JSON.stringify(payload), {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as any;
      console.log('Webhook event verified at', new Date().toISOString(), ':', evt.type);
    } catch (err) {
      console.error('Webhook verification failed at', new Date().toISOString(), ':', err);
      return new Response(JSON.stringify({ ok: false, message: 'Invalid signature', error: err.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const { id: clerkId, email_addresses, first_name, last_name, phone_numbers } = evt.data;
      const email = email_addresses?.[0]?.email_address || '';
      const phone = phone_numbers?.[0]?.phone_number || null;

      console.log('Processing user at', new Date().toISOString(), ':', { clerkId, email });

      if (!clerkId || !email_addresses) {
        console.error('Missing required user data at', new Date().toISOString());
        return new Response(JSON.stringify({ ok: false, message: 'Missing user data' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      await prisma.user.upsert({
        where: { clerkId },
        update: { email, firstName: first_name, lastName: last_name, phone },
        create: { clerkId, email, firstName: first_name, lastName: last_name, phone, gender: 'MALE', password: 'placeholder' },
      });
      console.log('✅ User synced via webhook at', new Date().toISOString(), ':', email);
    }

    return new Response(JSON.stringify({ ok: true, message: 'Sync successful' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('❌ Server error in sync-user route at', new Date().toISOString(), ':', error);
    return new Response(JSON.stringify({ ok: false, message: 'Server error', error: error.message, stack: error.stack }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}