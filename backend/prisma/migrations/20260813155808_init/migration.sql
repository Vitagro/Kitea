-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('STORE', 'WAREHOUSE', 'HUB_3PL', 'CROSS_DOCK');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('STORE_MANAGER', 'WAREHOUSE_MANAGER', 'DRIVER', 'DISPATCHER', 'HEAD_OF_LOGISTICS');

-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('TRANSPORT_FLAT_ZONE', 'TRANSPORT_PER_KM', 'TRANSPORT_PER_VEHICLE', 'STORAGE_PER_PALLET_DAY', 'STORAGE_PER_M2_MONTH', 'HANDLING_IN', 'HANDLING_OUT');

-- CreateEnum
CREATE TYPE "PricingSource" AS ENUM ('INTERNAL', 'EXTERNAL_3PL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONSOLIDATED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PLANNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryPerformance" AS ENUM ('ON_TIME', 'LATE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchingStatus" AS ENUM ('PENDING_INVOICE', 'MATCHED', 'DISCREPANCY', 'APPROVED', 'REJECTED', 'CREDIT_NOTE_REQUESTED');

-- CreateEnum
CREATE TYPE "ErpDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "ErpSyncStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'MA',
    "capacity_pallets" INTEGER,
    "storage_area_m2" DOUBLE PRECISION,
    "storage_volume_m3" DOUBLE PRECISION,
    "buffer_stock_units" INTEGER,
    "delivery_window_start" TEXT,
    "delivery_window_end" TEXT,
    "truck_access_restriction" TEXT,
    "operating_days" TEXT,
    "operator_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "website" TEXT DEFAULT 'https://www.kitea.com',
    "opening_hours_text" TEXT,
    "google_maps_url" TEXT,
    "google_place_id" TEXT,
    "plus_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distance_matrix" (
    "id" TEXT NOT NULL,
    "from_location_id" TEXT NOT NULL,
    "to_location_id" TEXT NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'HAVERSINE',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distance_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "EmployeeRole" NOT NULL,
    "location_id" TEXT,
    "hire_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_volume_m3" DOUBLE PRECISION NOT NULL,
    "max_weight_kg" DOUBLE PRECISION NOT NULL,
    "length_cm" DOUBLE PRECISION,
    "width_cm" DOUBLE PRECISION,
    "height_cm" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "contact_email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rule_type" "PricingRuleType" NOT NULL,
    "source" "PricingSource" NOT NULL DEFAULT 'INTERNAL',
    "carrier_id" TEXT,
    "vehicle_type_id" TEXT,
    "storage_location_id" TEXT,
    "zone_name" TEXT,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "origin_location_id" TEXT NOT NULL,
    "destination_location_id" TEXT NOT NULL,
    "volume_m3" DOUBLE PRECISION NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "is_fragile" BOOLEAN NOT NULL DEFAULT false,
    "is_stackable" BOOLEAN NOT NULL DEFAULT true,
    "delivery_window_start" TIMESTAMP(3) NOT NULL,
    "delivery_window_end" TIMESTAMP(3) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "shipment_id" TEXT,
    "erp_source_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "origin_location_id" TEXT NOT NULL,
    "destination_location_id" TEXT NOT NULL,
    "vehicle_type_id" TEXT,
    "carrier_id" TEXT,
    "driver_id" TEXT,
    "total_volume_m3" DOUBLE PRECISION NOT NULL,
    "total_weight_kg" DOUBLE PRECISION NOT NULL,
    "fill_rate_percent" DOUBLE PRECISION,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduled_departure" TIMESTAMP(3),
    "scheduled_arrival" TIMESTAMP(3),
    "actual_departure" TIMESTAMP(3),
    "actual_arrival" TIMESTAMP(3),
    "delivery_performance" "DeliveryPerformance",
    "theoretical_cost" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "carrier_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrier_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_invoices" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "carrier_invoice_id" TEXT,
    "theoretical_amount" DOUBLE PRECISION NOT NULL,
    "carrier_amount" DOUBLE PRECISION,
    "gap_amount" DOUBLE PRECISION,
    "gap_percent" DOUBLE PRECISION,
    "tolerance_threshold_percent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "matching_status" "MatchingStatus" NOT NULL DEFAULT 'PENDING_INVOICE',
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "validation_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erp_sync_logs" (
    "id" TEXT NOT NULL,
    "direction" "ErpDirection" NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "ErpSyncStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "erp_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "locations_google_place_id_key" ON "locations"("google_place_id");

-- CreateIndex
CREATE INDEX "locations_type_idx" ON "locations"("type");

-- CreateIndex
CREATE INDEX "locations_city_idx" ON "locations"("city");

-- CreateIndex
CREATE INDEX "distance_matrix_from_location_id_idx" ON "distance_matrix"("from_location_id");

-- CreateIndex
CREATE INDEX "distance_matrix_to_location_id_idx" ON "distance_matrix"("to_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "distance_matrix_from_location_id_to_location_id_key" ON "distance_matrix"("from_location_id", "to_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_role_idx" ON "employees"("role");

-- CreateIndex
CREATE INDEX "employees_location_id_idx" ON "employees"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_types_code_key" ON "vehicle_types"("code");

-- CreateIndex
CREATE INDEX "pricing_rules_rule_type_idx" ON "pricing_rules"("rule_type");

-- CreateIndex
CREATE INDEX "pricing_rules_source_idx" ON "pricing_rules"("source");

-- CreateIndex
CREATE UNIQUE INDEX "orders_reference_key" ON "orders"("reference");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_origin_location_id_destination_location_id_idx" ON "orders"("origin_location_id", "destination_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_reference_key" ON "shipments"("reference");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_driver_id_idx" ON "shipments"("driver_id");

-- CreateIndex
CREATE INDEX "shipments_delivery_performance_idx" ON "shipments"("delivery_performance");

-- CreateIndex
CREATE UNIQUE INDEX "pre_invoices_reference_key" ON "pre_invoices"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "pre_invoices_shipment_id_key" ON "pre_invoices"("shipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "pre_invoices_carrier_invoice_id_key" ON "pre_invoices"("carrier_invoice_id");

-- CreateIndex
CREATE INDEX "pre_invoices_matching_status_idx" ON "pre_invoices"("matching_status");

-- CreateIndex
CREATE INDEX "erp_sync_logs_direction_status_idx" ON "erp_sync_logs"("direction", "status");

-- AddForeignKey
ALTER TABLE "distance_matrix" ADD CONSTRAINT "distance_matrix_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distance_matrix" ADD CONSTRAINT "distance_matrix_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_storage_location_id_fkey" FOREIGN KEY ("storage_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_origin_location_id_fkey" FOREIGN KEY ("origin_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_origin_location_id_fkey" FOREIGN KEY ("origin_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_invoices" ADD CONSTRAINT "carrier_invoices_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_invoices" ADD CONSTRAINT "pre_invoices_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_invoices" ADD CONSTRAINT "pre_invoices_carrier_invoice_id_fkey" FOREIGN KEY ("carrier_invoice_id") REFERENCES "carrier_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
