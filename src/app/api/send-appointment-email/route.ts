import { NextResponse } from "next/server";
import resend from "@/lib/resend";
import AppointmentConfirmationEmail from "../../../components/emails/AppointmentConfirmationEmail";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";

interface EmailBody {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType?: string;
  duration?: number;
  price?: string;
  patientName?: string;
}

export async function POST(request: Request) {
  try {
    const body: EmailBody = await request.json();
    const { doctorId, appointmentDate, appointmentTime, appointmentType, duration, price, patientName } = body;

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // جلب بيانات الدكتور من قاعدة البيانات
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // إنشاء الموعد في قاعدة البيانات
    const appointment = await prisma.appointment.create({
      data: {
        userId: "guest", // لو مش عندك userId حقيقي
        doctorId: doctor.id,
        date: new Date(appointmentDate),
        time: appointmentTime,
        reason: appointmentType || "General consultation",
        status: "CONFIRMED",
        duration: duration || 30,
      },
      include: {
        doctor: { select: { name: true, email: true } },
      },
    });

    // تحويل React Email component إلى HTML صالح للإيميل
    const html = await render(
      AppointmentConfirmationEmail({
        doctorName: doctor.name,
        appointmentDate,
        appointmentTime,
        appointmentType: appointmentType || "General consultation",
        duration: (duration || 30).toString(),
        price: price || "N/A",
      })
    );

    // إرسال الإيميل للدكتور
    const emailData = await resend.emails.send({
      from: "DentOra <no-reply@resend.dev>",
      to: [doctor.email], // هنا البريد للدكتور
      subject: "New Appointment Scheduled - DentOra",
      html,
    });

    return NextResponse.json({ message: "Email sent to doctor successfully"}, { status: 200 });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
