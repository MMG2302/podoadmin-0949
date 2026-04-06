/**
 * Utilidades para migrar datos de localStorage a D1
 * Este archivo contiene funciones helper para la migración
 */

import { database } from '../database';
import {
  patients,
  clinicalSessions,
  createdUsers,
  userCredits,
  creditTransactions,
  clinics,
  clinicCredits,
  appointments,
  auditLog,
} from '../database/schema';

/**
 * Migra pacientes desde localStorage a D1
 */
export async function migratePatientsFromLocalStorage(
  localStorageData: any[]
): Promise<void> {
  if (!localStorageData || localStorageData.length === 0) {
    return;
  }

  for (const patient of localStorageData) {
    try {
      await database.insert(patients).values({
        id: patient.id,
        folio: patient.folio,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        idNumber: patient.idNumber,
        phone: patient.phone || '',
        email: patient.email || null,
        address: patient.address || null,
        city: patient.city || null,
        postalCode: patient.postalCode || null,
        medicalHistory: JSON.stringify(patient.medicalHistory || {}),
        consent: JSON.stringify(patient.consent || { given: false, date: null }),
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        createdBy: patient.createdBy,
        clinicId: patient.clinicId || null,
      }).onConflictDoNothing();
    } catch (error) {
      console.error(`Error migrando paciente ${patient.id}:`, error);
    }
  }
}

/**
 * Migra sesiones clínicas desde localStorage a D1
 */
export async function migrateSessionsFromLocalStorage(
  localStorageData: any[]
): Promise<void> {
  if (!localStorageData || localStorageData.length === 0) {
    return;
  }

  for (const session of localStorageData) {
    try {
      await database.insert(clinicalSessions).values({
        id: session.id,
        patientId: session.patientId,
        sessionDate: session.sessionDate,
        sessionType: session.sessionType || 'routine',
        diagnosis: session.diagnosis || session.clinicalNotes || null,
        treatment: session.treatmentPlan || null,
        notes: session.anamnesis || session.clinicalNotes || null,
        creditsUsed: session.creditsUsed || 0,
        createdBy: session.createdBy,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        clinicId: session.clinicId || null,
      }).onConflictDoNothing();
    } catch (error) {
      console.error(`Error migrando sesión ${session.id}:`, error);
    }
  }
}

/**
 * Migra usuarios creados desde localStorage a D1
 */
export async function migrateUsersFromLocalStorage(
  localStorageData: any[]
): Promise<void> {
  if (!localStorageData || localStorageData.length === 0) {
    return;
  }

  for (const user of localStorageData) {
    try {
      await database.insert(createdUsers).values({
        id: user.id,
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        clinicId: user.clinicId || null,
        password: user.password, // En producción, esto debería ser un hash
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        createdBy: user.createdBy || null,
        isBlocked: user.isBlocked || false,
        isBanned: user.isBanned || false,
        isEnabled: user.isEnabled !== false,
      }).onConflictDoNothing();
    } catch (error) {
      console.error(`Error migrando usuario ${user.id}:`, error);
    }
  }
}

/**
 * Migra créditos de usuario desde localStorage a D1
 */
export async function migrateUserCreditsFromLocalStorage(
  localStorageData: Record<string, any>
): Promise<void> {
  if (!localStorageData) {
    return;
  }

  for (const [userId, credits] of Object.entries(localStorageData)) {
    try {
      const creditData = credits as any;
      await database.insert(userCredits).values({
        userId,
        totalCredits: (creditData.monthlyCredits || 0) + (creditData.extraCredits || 0),
        usedCredits: creditData.reservedCredits || 0,
        createdAt: creditData.lastMonthlyReset || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).onConflictDoUpdate({
        set: {
          totalCredits: (creditData.monthlyCredits || 0) + (creditData.extraCredits || 0),
          usedCredits: creditData.reservedCredits || 0,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(`Error migrando créditos de usuario ${userId}:`, error);
    }
  }
}

/**
 * Migra transacciones de créditos desde localStorage a D1
 */
export async function migrateCreditTransactionsFromLocalStorage(
  localStorageData: any[]
): Promise<void> {
  if (!localStorageData || localStorageData.length === 0) {
    return;
  }

  for (const transaction of localStorageData) {
    try {
      await database.insert(creditTransactions).values({
        id: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description || null,
        sessionId: transaction.sessionId || null,
        createdAt: transaction.createdAt,
        clinicId: transaction.clinicId || null,
      }).onConflictDoNothing();
    } catch (error) {
      console.error(`Error migrando transacción ${transaction.id}:`, error);
    }
  }
}

/**
 * Migra clínicas desde localStorage a D1
 */
export async function migrateClinicsFromLocalStorage(
  localStorageData: any[]
): Promise<void> {
  if (!localStorageData || localStorageData.length === 0) {
    return;
  }

  for (const clinic of localStorageData) {
    try {
      await database.insert(clinics).values({
        clinicId: clinic.clinicId,
        clinicName: clinic.clinicName,
        clinicCode: clinic.clinicCode,
        ownerId: clinic.ownerId,
        logo: clinic.logo || null,
        phone: clinic.phone || null,
        email: clinic.email || null,
        address: clinic.address || null,
        city: clinic.city || null,
        postalCode: clinic.postalCode || null,
        licenseNumber: clinic.licenseNumber || null,
        website: clinic.website || null,
        createdAt: clinic.createdAt,
      }).onConflictDoNothing();
    } catch (error) {
      console.error(`Error migrando clínica ${clinic.clinicId}:`, error);
    }
  }
}

/**
 * Migra créditos de clínica desde localStorage a D1
 */
export async function migrateClinicCreditsFromLocalStorage(
  localStorageData: any[]
): Promise<void> {
  if (!localStorageData || localStorageData.length === 0) {
    return;
  }

  for (const clinicCredit of localStorageData) {
    try {
      await database.insert(clinicCredits).values({
        clinicId: clinicCredit.clinicId,
        totalCredits: clinicCredit.totalCredits || 0,
        distributedToDate: clinicCredit.distributedToDate || 0,
        createdAt: clinicCredit.createdAt,
        updatedAt: clinicCredit.updatedAt || new Date().toISOString(),
      }).onConflictDoUpdate({
        set: {
          totalCredits: clinicCredit.totalCredits || 0,
          distributedToDate: clinicCredit.distributedToDate || 0,
          updatedAt: clinicCredit.updatedAt || new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(`Error migrando créditos de clínica ${clinicCredit.clinicId}:`, error);
    }
  }
}

/**
 * Migra citas desde localStorage a D1
 */
export async function migrateAppointmentsFromLocalStorage(
  localStorageData: any[]
): Promise<void> {
  if (!localStorageData || localStorageData.length === 0) {
    return;
  }

  for (const appointment of localStorageData) {
    try {
      await database.insert(appointments).values({
        id: appointment.id,
        patientId: appointment.patientId || null,
        sessionDate: appointment.date,
        sessionTime: appointment.time,
        reason: appointment.reason || 'other',
        status: appointment.status || 'scheduled',
        notes: appointment.notes || null,
        createdBy: appointment.podiatristId,
        createdAt: appointment.createdAt || new Date().toISOString(),
        updatedAt: appointment.updatedAt || new Date().toISOString(),
        clinicId: appointment.clinicId || null,
        pendingPatientName: appointment.pendingPatientName || null,
        pendingPatientPhone: appointment.pendingPatientPhone || null,
      }).onConflictDoNothing();
    } catch (error) {
      console.error(`Error migrando cita ${appointment.id}:`, error);
    }
  }
}

/**
 * Migra log de auditoría desde localStorage a D1
 */
export async function migrateAuditLogFromLocalStorage(
  localStorageData: any[]
): Promise<void> {
  if (!localStorageData || localStorageData.length === 0) {
    return;
  }

  for (const log of localStorageData) {
    try {
      await database.insert(auditLog).values({
        id: log.id,
        userId: log.userId,
        action: log.action,
        resourceType: log.entityType,
        resourceId: log.entityId || null,
        details: JSON.stringify(log.details || {}),
        ipAddress: null,
        userAgent: null,
        createdAt: log.createdAt,
        clinicId: log.clinicId || null,
      }).onConflictDoNothing();
    } catch (error) {
      console.error(`Error migrando log ${log.id}:`, error);
    }
  }
}
