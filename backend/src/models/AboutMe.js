const { db } = require('../config/firebase');

/**
 * AboutMe Model (Firestore-based)
 * Document ID = Admin UID (only admins can have aboutMe data)
 * Structure: aboutMe/{adminUid}/facts/{factId}
 */

class AboutMe {
  /**
   * Add a fact for an admin
   * @param {string} adminUid - Admin's UID
   * @param {object} factData - Fact data
   */
  static async addFact(adminUid, factData) {
    const factRef = db.collection('aboutMe').doc(adminUid).collection('facts').doc();
    
    const data = {
      key: factData.key,
      value: factData.value,
      category: factData.category || 'other',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await factRef.set(data);
    return { id: factRef.id, ...data };
  }

  /**
   * Get all facts for an admin
   * @param {string} adminUid - Admin's UID
   */
  static async getAllFacts(adminUid) {
    const snapshot = await db.collection('aboutMe').doc(adminUid).collection('facts').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Get a specific fact
   * @param {string} adminUid - Admin's UID
   * @param {string} factId - Fact ID
   */
  static async getFact(adminUid, factId) {
    const factDoc = await db.collection('aboutMe').doc(adminUid).collection('facts').doc(factId).get();
    if (!factDoc.exists) {
      return null;
    }
    return { id: factDoc.id, ...factDoc.data() };
  }

  /**
   * Update a fact
   * @param {string} adminUid - Admin's UID
   * @param {string} factId - Fact ID
   * @param {object} updates - Updates to apply
   */
  static async updateFact(adminUid, factId, updates) {
    const factRef = db.collection('aboutMe').doc(adminUid).collection('facts').doc(factId);
    updates.updatedAt = new Date();
    await factRef.update(updates);
    return this.getFact(adminUid, factId);
  }

  /**
   * Delete a fact
   * @param {string} adminUid - Admin's UID
   * @param {string} factId - Fact ID
   */
  static async deleteFact(adminUid, factId) {
    await db.collection('aboutMe').doc(adminUid).collection('facts').doc(factId).delete();
  }

  /**
   * Search facts by key (for automation service)
   * @param {string} adminUid - Admin's UID
   * @param {string} searchKey - Key to search for
   */
  static async searchByKey(adminUid, searchKey) {
    const snapshot = await db.collection('aboutMe').doc(adminUid).collection('facts')
      .where('key', '==', searchKey.toLowerCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Get facts as key-value map (for caching)
   * @param {string} adminUid - Admin's UID
   */
  static async getFactsMap(adminUid) {
    const facts = await this.getAllFacts(adminUid);
    return facts.reduce((acc, fact) => {
      acc[fact.key.toLowerCase()] = fact.value;
      return acc;
    }, {});
  }
}

module.exports = AboutMe;
