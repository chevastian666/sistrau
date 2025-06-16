const { mockDb } = require('../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { createBlockchainRecord } = require('../services/blockchainService');

class ECMR {
  // Estados del e-CMR
  static STATUS = {
    DRAFT: 'draft',                       // Borrador
    ISSUED: 'issued',                     // Emitido
    IN_TRANSIT: 'in_transit',            // En tránsito
    DELIVERED: 'delivered',               // Entregado
    COMPLETED: 'completed',               // Completado
    CANCELLED: 'cancelled'                // Cancelado
  };

  // Tipos de firma
  static SIGNATURE_TYPES = {
    SENDER: 'sender',                     // Remitente
    CARRIER: 'carrier',                   // Transportista
    RECEIVER: 'receiver',                 // Destinatario
    DRIVER: 'driver'                      // Conductor
  };

  // Crear nuevo e-CMR
  static async create(data) {
    const ecmr = {
      id: `ECMR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: this.STATUS.DRAFT,
      
      // Información del envío
      shipmentDetails: {
        description: data.description,
        weight: data.weight,
        volume: data.volume,
        packages: data.packages,
        value: data.value,
        dangerousGoods: data.dangerousGoods || false,
        temperature: data.temperature || null
      },

      // Partes involucradas
      sender: {
        name: data.senderName,
        address: data.senderAddress,
        taxId: data.senderTaxId,
        contact: data.senderContact
      },
      
      receiver: {
        name: data.receiverName,
        address: data.receiverAddress,
        taxId: data.receiverTaxId,
        contact: data.receiverContact
      },
      
      carrier: {
        name: data.carrierName,
        taxId: data.carrierTaxId,
        license: data.carrierLicense,
        vehicleId: data.vehicleId,
        driverId: data.driverId
      },

      // Ruta y tiempos
      route: {
        origin: data.origin,
        destination: data.destination,
        plannedRoute: data.plannedRoute || [],
        estimatedDistance: data.estimatedDistance,
        estimatedDuration: data.estimatedDuration
      },

      // Fechas
      dates: {
        created: new Date().toISOString(),
        issued: null,
        pickupScheduled: data.pickupScheduled,
        pickupActual: null,
        deliveryScheduled: data.deliveryScheduled,
        deliveryActual: null
      },

      // Firmas digitales
      signatures: [],

      // Documentos adjuntos
      attachments: data.attachments || [],

      // Tracking
      tracking: {
        currentLocation: null,
        lastUpdate: null,
        events: []
      },

      // Blockchain
      blockchainHash: null,

      // Metadatos
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!mockDb.ecmrs) {
      mockDb.ecmrs = [];
    }
    mockDb.ecmrs.push(ecmr);

    logger.info(`e-CMR created: ${ecmr.id}`);
    return ecmr;
  }

  // Emitir e-CMR (cambiar estado a issued)
  static async issue(ecmrId, issuedBy) {
    const ecmr = await this.findById(ecmrId);
    if (!ecmr) {
      throw new Error('e-CMR not found');
    }

    if (ecmr.status !== this.STATUS.DRAFT) {
      throw new Error('e-CMR must be in draft status to issue');
    }

    ecmr.status = this.STATUS.ISSUED;
    ecmr.dates.issued = new Date().toISOString();
    ecmr.updatedAt = new Date().toISOString();

    // Registrar en blockchain
    try {
      const blockchainData = {
        type: 'ecmr_issued',
        ecmrId: ecmr.id,
        issuedBy,
        timestamp: new Date().toISOString(),
        hash: this.generateHash(ecmr)
      };
      
      ecmr.blockchainHash = await createBlockchainRecord(blockchainData);
    } catch (error) {
      logger.error('Failed to record e-CMR in blockchain:', error);
    }

    // Agregar evento
    this.addEvent(ecmr, {
      type: 'issued',
      timestamp: new Date().toISOString(),
      userId: issuedBy,
      details: 'e-CMR issued'
    });

    return ecmr;
  }

  // Firmar e-CMR
  static async sign(ecmrId, signatureData) {
    const ecmr = await this.findById(ecmrId);
    if (!ecmr) {
      throw new Error('e-CMR not found');
    }

    const signature = {
      id: `sig_${Date.now()}`,
      type: signatureData.type,
      signedBy: signatureData.userId,
      signedAt: new Date().toISOString(),
      signatureData: signatureData.signature, // En producción sería firma digital real
      location: signatureData.location,
      ipAddress: signatureData.ipAddress
    };

    ecmr.signatures.push(signature);
    ecmr.updatedAt = new Date().toISOString();

    // Actualizar estado según tipo de firma
    if (signature.type === this.SIGNATURE_TYPES.RECEIVER) {
      ecmr.status = this.STATUS.DELIVERED;
      ecmr.dates.deliveryActual = new Date().toISOString();
    }

    // Registrar en blockchain
    try {
      const blockchainData = {
        type: 'ecmr_signed',
        ecmrId: ecmr.id,
        signatureType: signature.type,
        signedBy: signature.signedBy,
        timestamp: signature.signedAt
      };
      
      await createBlockchainRecord(blockchainData);
    } catch (error) {
      logger.error('Failed to record signature in blockchain:', error);
    }

    // Agregar evento
    this.addEvent(ecmr, {
      type: 'signed',
      timestamp: new Date().toISOString(),
      userId: signatureData.userId,
      details: `${signature.type} signature added`
    });

    return ecmr;
  }

  // Actualizar ubicación
  static async updateLocation(ecmrId, locationData) {
    const ecmr = await this.findById(ecmrId);
    if (!ecmr) {
      throw new Error('e-CMR not found');
    }

    ecmr.tracking.currentLocation = {
      lat: locationData.lat,
      lng: locationData.lng,
      address: locationData.address,
      timestamp: new Date().toISOString()
    };
    ecmr.tracking.lastUpdate = new Date().toISOString();

    // Si es la primera ubicación después de emitir, marcar como en tránsito
    if (ecmr.status === this.STATUS.ISSUED) {
      ecmr.status = this.STATUS.IN_TRANSIT;
      ecmr.dates.pickupActual = new Date().toISOString();
    }

    // Agregar evento
    this.addEvent(ecmr, {
      type: 'location_update',
      timestamp: new Date().toISOString(),
      location: ecmr.tracking.currentLocation,
      details: 'Location updated'
    });

    ecmr.updatedAt = new Date().toISOString();
    return ecmr;
  }

  // Completar e-CMR
  static async complete(ecmrId, completedBy) {
    const ecmr = await this.findById(ecmrId);
    if (!ecmr) {
      throw new Error('e-CMR not found');
    }

    // Verificar que todas las firmas necesarias estén presentes
    const requiredSignatures = [
      this.SIGNATURE_TYPES.SENDER,
      this.SIGNATURE_TYPES.CARRIER,
      this.SIGNATURE_TYPES.RECEIVER
    ];

    const presentSignatures = ecmr.signatures.map(s => s.type);
    const missingSignatures = requiredSignatures.filter(s => !presentSignatures.includes(s));

    if (missingSignatures.length > 0) {
      throw new Error(`Missing required signatures: ${missingSignatures.join(', ')}`);
    }

    ecmr.status = this.STATUS.COMPLETED;
    ecmr.updatedAt = new Date().toISOString();

    // Registrar finalización en blockchain
    try {
      const blockchainData = {
        type: 'ecmr_completed',
        ecmrId: ecmr.id,
        completedBy,
        timestamp: new Date().toISOString(),
        finalHash: this.generateHash(ecmr)
      };
      
      await createBlockchainRecord(blockchainData);
    } catch (error) {
      logger.error('Failed to record completion in blockchain:', error);
    }

    // Agregar evento
    this.addEvent(ecmr, {
      type: 'completed',
      timestamp: new Date().toISOString(),
      userId: completedBy,
      details: 'e-CMR completed successfully'
    });

    return ecmr;
  }

  // Buscar por ID
  static async findById(id) {
    return mockDb.ecmrs?.find(e => e.id === id) || null;
  }

  // Buscar por vehículo
  static async findByVehicle(vehicleId, options = {}) {
    const { status, startDate, endDate, limit = 50 } = options;
    
    let ecmrs = mockDb.ecmrs?.filter(e => e.carrier.vehicleId === vehicleId) || [];
    
    if (status) {
      ecmrs = ecmrs.filter(e => e.status === status);
    }
    
    if (startDate) {
      ecmrs = ecmrs.filter(e => new Date(e.createdAt) >= new Date(startDate));
    }
    
    if (endDate) {
      ecmrs = ecmrs.filter(e => new Date(e.createdAt) <= new Date(endDate));
    }
    
    // Ordenar por fecha de creación descendente
    ecmrs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return ecmrs.slice(0, limit);
  }

  // Buscar por empresa
  static async findByCompany(companyTaxId, options = {}) {
    const { role = 'any', status, limit = 50 } = options;
    
    let ecmrs = mockDb.ecmrs || [];
    
    // Filtrar por rol
    if (role === 'sender') {
      ecmrs = ecmrs.filter(e => e.sender.taxId === companyTaxId);
    } else if (role === 'receiver') {
      ecmrs = ecmrs.filter(e => e.receiver.taxId === companyTaxId);
    } else if (role === 'carrier') {
      ecmrs = ecmrs.filter(e => e.carrier.taxId === companyTaxId);
    } else {
      // Cualquier rol
      ecmrs = ecmrs.filter(e => 
        e.sender.taxId === companyTaxId ||
        e.receiver.taxId === companyTaxId ||
        e.carrier.taxId === companyTaxId
      );
    }
    
    if (status) {
      ecmrs = ecmrs.filter(e => e.status === status);
    }
    
    ecmrs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return ecmrs.slice(0, limit);
  }

  // Generar hash del e-CMR
  static generateHash(ecmr) {
    const dataToHash = {
      id: ecmr.id,
      shipmentDetails: ecmr.shipmentDetails,
      sender: ecmr.sender,
      receiver: ecmr.receiver,
      carrier: ecmr.carrier,
      route: ecmr.route,
      signatures: ecmr.signatures
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(dataToHash))
      .digest('hex');
  }

  // Agregar evento al tracking
  static addEvent(ecmr, event) {
    if (!ecmr.tracking.events) {
      ecmr.tracking.events = [];
    }
    
    ecmr.tracking.events.push({
      id: `evt_${Date.now()}`,
      ...event
    });
  }

  // Verificar integridad del e-CMR
  static async verifyIntegrity(ecmrId) {
    const ecmr = await this.findById(ecmrId);
    if (!ecmr) {
      throw new Error('e-CMR not found');
    }

    const currentHash = this.generateHash(ecmr);
    
    // En producción, comparar con hash almacenado en blockchain
    return {
      valid: true, // Simulado
      currentHash,
      blockchainHash: ecmr.blockchainHash,
      lastVerified: new Date().toISOString()
    };
  }

  // Obtener estadísticas
  static async getStatistics(filters = {}) {
    const ecmrs = mockDb.ecmrs || [];
    
    const stats = {
      total: ecmrs.length,
      byStatus: {},
      avgDeliveryTime: 0,
      onTimeDeliveryRate: 0
    };

    // Contar por estado
    ecmrs.forEach(ecmr => {
      stats.byStatus[ecmr.status] = (stats.byStatus[ecmr.status] || 0) + 1;
    });

    // Calcular tiempo promedio de entrega
    const completedEcmrs = ecmrs.filter(e => e.status === this.STATUS.COMPLETED);
    if (completedEcmrs.length > 0) {
      const deliveryTimes = completedEcmrs.map(e => {
        const pickup = new Date(e.dates.pickupActual);
        const delivery = new Date(e.dates.deliveryActual);
        return (delivery - pickup) / (1000 * 60 * 60); // Horas
      });
      
      stats.avgDeliveryTime = deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length;
    }

    // Calcular tasa de entrega a tiempo
    const onTimeDeliveries = completedEcmrs.filter(e => {
      const scheduledDelivery = new Date(e.dates.deliveryScheduled);
      const actualDelivery = new Date(e.dates.deliveryActual);
      return actualDelivery <= scheduledDelivery;
    });
    
    if (completedEcmrs.length > 0) {
      stats.onTimeDeliveryRate = (onTimeDeliveries.length / completedEcmrs.length) * 100;
    }

    return stats;
  }
}

module.exports = ECMR;