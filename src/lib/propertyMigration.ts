import mongoose from 'mongoose';
import Property from '@/models/Property';
import Room from '@/models/Room';
import User from '@/models/User';
import Renter from '@/models/Renter';
import Meter from '@/models/Meter';
import MeterReading from '@/models/MeterReading';
import Bill from '@/models/Bill';
import Payment from '@/models/Payment';
import Transaction from '@/models/Transaction';
import { connectToDatabase } from '@/lib/db';

let migrationPromise: Promise<any> | null = null;

export async function ensureDefaultProperty() {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    try {
      await connectToDatabase();

      // 1. Find Admin user
      const admin = await User.findOne({ role: 'admin' });
      const adminId = admin?._id;

      // Check if any legacy rooms exist without a propertyId
      const unassignedRooms = await Room.countDocuments({
        $or: [{ propertyId: { $exists: false } }, { propertyId: null }],
      });

      // If no unassigned rooms need migration, do not auto-create dummy properties
      if (unassignedRooms === 0) {
        return null;
      }

      // 2. Find or create default property
      let defaultProp = await Property.findOne();

      if (!defaultProp) {
        defaultProp = await Property.create({
          adminId,
          name: 'Primary Property',
          type: 'Building',
          address: 'Main Building',
          city: 'Varanasi',
          state: 'Uttar Pradesh',
          pinCode: '221005',
          status: 'ACTIVE',
          phone: '8114252525',
          email: admin?.email || 'adarshcsbhu@gmail.com',
          defaultRentDueDay: 5,
          defaultElectricityRate: 10,
          currency: 'INR',
        });
      } else {
        let needsSave = false;
        if (!defaultProp.adminId && adminId) {
          defaultProp.adminId = adminId;
          needsSave = true;
        }
        if (!defaultProp.status) {
          defaultProp.status = 'ACTIVE';
          needsSave = true;
        }
        if (!defaultProp.type) {
          defaultProp.type = 'Building';
          needsSave = true;
        }
        if (defaultProp.name === 'Adarsh Tiwari ' || defaultProp.name === 'KirayaPro') {
          defaultProp.name = 'KirayaPro Central';
          needsSave = true;
        }
        if (!defaultProp.city) {
          defaultProp.city = 'Varanasi';
          needsSave = true;
        }
        if (!defaultProp.state) {
          defaultProp.state = 'Uttar Pradesh';
          needsSave = true;
        }
        if (!defaultProp.pinCode) {
          defaultProp.pinCode = '221005';
          needsSave = true;
        }
        if (needsSave) {
          await defaultProp.save();
        }
      }

      // 3. Drop global roomNumber_1 unique index if it exists in MongoDB
      try {
        const roomCollection = mongoose.connection.collection('rooms');
        const indexes = await roomCollection.indexes();
        const roomNumIndex = indexes.find((idx) => idx.name === 'roomNumber_1');
        if (roomNumIndex && roomNumIndex.unique) {
          await roomCollection.dropIndex('roomNumber_1');
          console.log('Successfully dropped old global roomNumber_1 unique index');
        }

        // Ensure compound unique index
        await roomCollection.createIndex(
          { propertyId: 1, roomNumber: 1 },
          { unique: true, background: true }
        );
      } catch (idxErr) {
        console.warn('Room index adjustment notice:', idxErr);
      }

      // 4. Backfill any existing unassigned records to default property
      const defaultId = defaultProp._id;
      await Promise.all([
        Room.updateMany(
          { $or: [{ propertyId: { $exists: false } }, { propertyId: null }] },
          { $set: { propertyId: defaultId, property: defaultId } }
        ),
        Renter.updateMany(
          { $or: [{ propertyId: { $exists: false } }, { propertyId: null }] },
          { $set: { propertyId: defaultId } }
        ),
        Meter.updateMany(
          { $or: [{ propertyId: { $exists: false } }, { propertyId: null }] },
          { $set: { propertyId: defaultId } }
        ),
        MeterReading.updateMany(
          { $or: [{ propertyId: { $exists: false } }, { propertyId: null }] },
          { $set: { propertyId: defaultId } }
        ),
        Bill.updateMany(
          { $or: [{ propertyId: { $exists: false } }, { propertyId: null }] },
          { $set: { propertyId: defaultId } }
        ),
        Payment.updateMany(
          { $or: [{ propertyId: { $exists: false } }, { propertyId: null }] },
          { $set: { propertyId: defaultId } }
        ),
        Transaction.updateMany(
          { $or: [{ propertyId: { $exists: false } }, { propertyId: null }] },
          { $set: { propertyId: defaultId } }
        ),
      ]);

      return defaultProp;
    } catch (err) {
      console.error('Property migration error:', err);
      migrationPromise = null;
      throw err;
    }
  })();

  return migrationPromise;
}
