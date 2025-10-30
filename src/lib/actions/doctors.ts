"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

// ✅ النوع الأساسي لإنشاء دكتور
export interface CreateDoctorInput {
  name: string;
  email: string;
  phone?: string | null;
  specialty: string;
  bio?: string | null;
  isActive: boolean;
}

// ✅ النوع المخصص للتحديث
export interface UpdateDoctorInput extends Partial<CreateDoctorInput> {
  id: string;
}

// 🩺 إحضار كل الدكاترة
export async function getDoctors() {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        _count: { select: { appointments: true } },
      },
      orderBy: { name: "desc" },
    });

    return doctors.map((doctor) => ({
      ...doctor,
      appointmentCount: doctor._count.appointments,
    }));
  } catch (error) {
    console.error("Error fetching doctors:", error);
    throw new Error("Failed to fetch doctors");
  }
}

// 🧑‍⚕️ إنشاء دكتور جديد
export async function createDoctor(input: CreateDoctorInput) {
  try {
    if (!input.name || !input.email) {
      throw new Error("Name and email are required");
    }

    const doctor = await prisma.doctor.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        specialty: input.specialty,
        bio: input.bio ?? null,
        isActive: input.isActive,
      },
    });

    revalidatePath("/admin");
    return doctor;
  } catch (error: any) {
    console.error("Error creating doctor:", error);

    if (error?.code === "P2002") {
      throw new Error("A doctor with this email already exists");
    }

    throw new Error("Failed to create doctor");
  }
}

// ✏️ تحديث بيانات دكتور
export async function updateDoctor(input: UpdateDoctorInput) {
  try {
    if (!input.name || !input.email) {
      throw new Error("Name and email are required");
    }

    const currentDoctor = await prisma.doctor.findUnique({
      where: { id: input.id },
      select: { email: true },
    });

    if (!currentDoctor) throw new Error("Doctor not found");

    if (input.email !== currentDoctor.email) {
      const existingDoctor = await prisma.doctor.findUnique({
        where: { email: input.email },
      });
      if (existingDoctor) {
        throw new Error("A doctor with this email already exists");
      }
    }

    const doctor = await prisma.doctor.update({
      where: { id: input.id },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        specialty: input.specialty,
        bio: input.bio ?? null,
        isActive: input.isActive ?? true,
      },
    });

    revalidatePath("/admin");
    return doctor;
  } catch (error) {
    console.error("Error updating doctor:", error);
    throw new Error("Failed to update doctor");
  }
}

// ✅ إحضار الدكاترة الفعالين فقط
export async function getAvailableDoctors() {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return doctors.map((doctor) => ({
      ...doctor,
      appointmentCount: doctor._count.appointments,
    }));
  } catch (error) {
    console.error("Error fetching available doctors:", error);
    throw new Error("Failed to fetch available doctors");
  }
}
