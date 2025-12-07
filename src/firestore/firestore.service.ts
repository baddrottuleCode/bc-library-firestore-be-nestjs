import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class FirestoreService implements OnModuleInit {
  private firestore!: Firestore;

  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }

    this.firestore = admin.firestore();
  }

  getFirestore(): Firestore {
    return this.firestore;
  }

  async getDocument<T = any>(collection: string, id: string): Promise<T | null> {
    const doc = await this.firestore.collection(collection).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as T;
  }

  async createDocument<T = any>(collection: string, data: T, docId?: string): Promise<T & { id: string }> {
    if (docId) {
      await this.firestore.collection(collection).doc(docId).set(data as admin.firestore.DocumentData);
      return { id: docId, ...data };
    } else {
      const docRef = await this.firestore.collection(collection).add(data as admin.firestore.DocumentData);
      return { id: docRef.id, ...data };
    }
  }

  async updateDocument<T = any>(collection: string, docId: string, data: Partial<T>): Promise<T & { id: string }> {
    await this.firestore.collection(collection).doc(docId).update(data as admin.firestore.UpdateData<admin.firestore.DocumentData>);
    return { id: docId, ...data } as T & { id: string };
  }

  async deleteDocument(collection: string, docId: string): Promise<void> {
    await this.firestore.collection(collection).doc(docId).delete();
  }

  async queryDocuments<T = any>(
    collection: string,
    field: string,
    operator: admin.firestore.WhereFilterOp,
    value: any
  ): Promise<(T & { id: string })[]> {
    const snapshot = await this.firestore
      .collection(collection)
      .where(field, operator, value)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (T & { id: string })[];
  }

  async queryDocumentsMultiple<T = any>(
    collection: string,
    conditions: Array<{
      field: string;
      operator: admin.firestore.WhereFilterOp;
      value: any;
    }>
  ): Promise<(T & { id: string })[]> {
    let query: admin.firestore.Query = this.firestore.collection(collection);

    for (const condition of conditions) {
      query = query.where(condition.field, condition.operator, condition.value);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (T & { id: string })[];
  }

  async getAllDocuments<T = any>(collection: string): Promise<(T & { id: string })[]> {
    const snapshot = await this.firestore.collection(collection).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (T & { id: string })[];
  }

  async documentExists(collection: string, docId: string): Promise<boolean> {
    const doc = await this.firestore.collection(collection).doc(docId).get();
    return doc.exists;
  }

  async countDocuments(collection: string): Promise<number> {
    const snapshot = await this.firestore.collection(collection).count().get();
    return snapshot.data().count;
  }
}
