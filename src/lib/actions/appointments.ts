"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { AppointmentStatus } from "@prisma/client";

function transformAppointment(appointment: any) {
  return {
    ...appointment,
    patientName: `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim(),
    patientEmail: appointment.user.email,
    doctorName: appointment.doctor.name,
    doctorImageUrl: appointment.doctor.imageUrl || "",
    date: appointment.date.toISOString().split("T")[0],
  };
}

export async function getAppointments() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        doctor: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    return appointments.map(transformAppointment);
  } catch (error) {
    console.log("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments");
  }
}

// ✅ هنا التعديل الأساسي
export async function getUserAppointments() {
  try {
    const user = await currentUser();
    if (!user) return []; // المستخدم مش داخل، رجع فاضي

    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
    if (!dbUser) return [];

    const appointments = await prisma.appointment.findMany({
      where: { userId: dbUser.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        doctor: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return appointments.map(transformAppointment);
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    return [];
  }
}

export async function getUserAppointmentStats() {
  try {
    const user = await currentUser();
    if (!user) return { totalAppointments: 0, completedAppointments: 0 };

    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
    if (!dbUser) return { totalAppointments: 0, completedAppointments: 0 };

    const [totalCount, completedCount] = await Promise.all([
      prisma.appointment.count({ where: { userId: dbUser.id } }),
      prisma.appointment.count({
        where: { userId: dbUser.id, status: AppointmentStatus.COMPLETED },
      }),
    ]);

    return {
      totalAppointments: totalCount,
      completedAppointments: completedCount,
    };
  } catch (error) {
    console.error("Error fetching user appointment stats:", error);
    return { totalAppointments: 0, completedAppointments: 0 };
  }
}

export async function getBookedTimeSlots(doctorId: string, date: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: new Date(date),
        status: { in: [AppointmentStatus.CONFIRMED] },
      },
      select: { time: true },
    });

    return appointments.map((appointment) => appointment.time);
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    return [];
  }
}

interface BookAppointmentInput {
  doctorId: string;
  date: string;
  time: string;
  reason?: string;
}

export async function bookAppointment(input: BookAppointmentInput) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("You must be logged in to book an appointment");

    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
    if (!dbUser) throw new Error("User not found");

    const appointment = await prisma.appointment.create({
      data: {
        userId: dbUser.id,
        doctorId: input.doctorId,
        date: new Date(input.date),
        time: input.time,
        reason: input.reason || "General consultation",
        status: "CONFIRMED",
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        doctor: { select: { name: true } },
      },
    });

    return transformAppointment(appointment);
  } catch (error) {
    console.error("Error booking appointment:", error);
    throw new Error("Failed to book appointment. Please try again later.");
  }
}

export async function updateAppointmentStatus(input: { id: string; status: AppointmentStatus }) {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: input.id },
      data: { status: input.status },
    });

    return appointment;
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment");
  }
}
