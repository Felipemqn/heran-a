-- CreateEnum
CREATE TYPE "GenerationTier" AS ENUM ('founder', 'heir', 'grandheir');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('founder', 'heir', 'observer', 'advisor');

-- CreateEnum
CREATE TYPE "AssetClass" AS ENUM ('fixed_income', 'equities', 'real_estate', 'alternatives', 'cash');

-- CreateEnum
CREATE TYPE "AssetSubclass" AS ENUM ('government_bonds', 'corporate_bonds', 'stocks_brazil', 'stocks_global', 'real_estate_funds', 'direct_real_estate', 'private_equity', 'hedge_funds', 'commodities', 'cash_brl', 'cash_usd');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('pending_review', 'approved', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "Liquidity" AS ENUM ('immediate', 'short_term', 'medium_term', 'long_term', 'illiquid');

-- CreateEnum
CREATE TYPE "ScenarioKind" AS ENUM ('deterministic', 'monte_carlo');

-- CreateEnum
CREATE TYPE "InvestmentHorizon" AS ENUM ('short', 'medium', 'long', 'generational');

-- CreateEnum
CREATE TYPE "RiskTolerance" AS ENUM ('conservative', 'moderate', 'balanced', 'growth', 'aggressive');

-- CreateTable
CREATE TABLE "family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "generation" "GenerationTier" NOT NULL,
    "birthDate" TIMESTAMP(3),
    "email" TEXT,
    "clerkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class" "AssetClass" NOT NULL,
    "subclass" "AssetSubclass" NOT NULL,
    "liquidity" "Liquidity" NOT NULL,
    "valueBrl" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "institution" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "class" "AssetClass" NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "valueBrl" DECIMAL(18,2) NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_value" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "valueBrl" DECIMAL(18,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ScenarioKind" NOT NULL,
    "allocation" JSONB NOT NULL,
    "initialBrl" DECIMAL(18,2) NOT NULL,
    "years" INTEGER NOT NULL,
    "sims" INTEGER,
    "result" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'pending_review',
    "responsibleId" TEXT,
    "meetingId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ips_version" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "horizon" "InvestmentHorizon" NOT NULL,
    "riskTolerance" "RiskTolerance" NOT NULL,
    "minLiquidityMonths" INTEGER NOT NULL,
    "restrictions" TEXT,
    "reviewCadence" TEXT NOT NULL,
    "targetAllocation" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ips_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "heldAt" TIMESTAMP(3) NOT NULL,
    "firefliesId" TEXT,
    "transcript" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "familyId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interaction" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "actorId" TEXT,
    "agent" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_slug_key" ON "family"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "member_clerkUserId_key" ON "member"("clerkUserId");

-- CreateIndex
CREATE INDEX "member_familyId_idx" ON "member"("familyId");

-- CreateIndex
CREATE INDEX "member_clerkUserId_idx" ON "member"("clerkUserId");

-- CreateIndex
CREATE INDEX "asset_familyId_idx" ON "asset"("familyId");

-- CreateIndex
CREATE INDEX "asset_familyId_class_idx" ON "asset"("familyId", "class");

-- CreateIndex
CREATE INDEX "allocation_familyId_snapshotDate_idx" ON "allocation"("familyId", "snapshotDate");

-- CreateIndex
CREATE INDEX "historical_value_familyId_recordedAt_idx" ON "historical_value"("familyId", "recordedAt");

-- CreateIndex
CREATE INDEX "scenario_familyId_idx" ON "scenario"("familyId");

-- CreateIndex
CREATE INDEX "decision_familyId_status_idx" ON "decision"("familyId", "status");

-- CreateIndex
CREATE INDEX "ips_version_familyId_idx" ON "ips_version"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "ips_version_familyId_version_key" ON "ips_version"("familyId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_firefliesId_key" ON "meeting"("firefliesId");

-- CreateIndex
CREATE INDEX "meeting_familyId_heldAt_idx" ON "meeting"("familyId", "heldAt");

-- CreateIndex
CREATE INDEX "audit_log_familyId_createdAt_idx" ON "audit_log"("familyId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "ai_interaction_familyId_createdAt_idx" ON "ai_interaction"("familyId", "createdAt");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation" ADD CONSTRAINT "allocation_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_value" ADD CONSTRAINT "historical_value_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario" ADD CONSTRAINT "scenario_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision" ADD CONSTRAINT "decision_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision" ADD CONSTRAINT "decision_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision" ADD CONSTRAINT "decision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ips_version" ADD CONSTRAINT "ips_version_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interaction" ADD CONSTRAINT "ai_interaction_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
