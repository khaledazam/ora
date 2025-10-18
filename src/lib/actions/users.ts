"use server"

import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "../prisma"

export async function syncUser() {
  try {
    const user = await currentUser()
    if (!user) return

    const email = user.emailAddresses?.[0]?.emailAddress || ""
    const firstName = user.firstName || ""
    const lastName = user.lastName || ""
    const phone = user.phoneNumbers?.[0]?.phoneNumber || null

    await prisma.user.upsert({
      where: { clerkId: user.id },
      update: { email, firstName, lastName, phone },
      create: {
        clerkId: user.id,
        email,
        firstName,
        lastName,
        phone,
        gender: "MALE",
        password: "placeholder"
      },
    })
  } catch (err) {
    console.error("Error syncing user:", err)
  }
}
