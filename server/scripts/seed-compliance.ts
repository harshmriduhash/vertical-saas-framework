/**
 * Seed compliance checklist data
 * Run with: pnpm tsx server/scripts/seed-compliance.ts
 */

import { getDb } from '../db';
import { complianceChecklists } from '../../drizzle/schema';
import { nanoid } from 'nanoid';

const soleProprietorChecklist = {
  id: nanoid(),
  title: 'Starting Right: 1099 / Sole Proprietor Compliance (MVP)',
  version: '1.0',
  region: 'San Diego County, CA',
  businessType: null, // Applies to all business types
  sections: [
    {
      id: 'A',
      title: 'Core Setup',
      description: 'The essential first steps for freelancers, gig workers, and solo business owners.',
      items: [
        {
          id: 'A1',
          label: 'Register Your Name (DBA)',
          details: "File a 'Doing Business As' name with your county or city if operating under a name other than your legal one.",
          link: 'https://data.sandiego.gov/',
          note: 'Socrata portal for local license and business lookup in San Diego.',
          frequency: 'once' as const,
        },
        {
          id: 'A2',
          label: 'Choose a Business Structure',
          details: 'Most start as sole proprietors; consider forming an LLC for liability protection.',
          link: 'https://www.sba.gov/business-guide/launch/choose-business-structure',
          note: 'SBA overview on structure options.',
          frequency: 'once' as const,
        },
        {
          id: 'A3',
          label: 'Get Your Tax ID (EIN)',
          details: 'Apply free through the IRS to avoid using your SSN on contracts and tax forms.',
          link: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online',
          frequency: 'once' as const,
        },
        {
          id: 'A4',
          label: 'Check Local Licenses / Permits',
          details: 'Most cities in San Diego County require a Business License Certificate or Business Tax Certificate.',
          link: 'https://www.sandiegocounty.gov/content/sdc/cosd/businesslicenses.html',
          frequency: 'annually' as const,
        },
      ],
    },
    {
      id: 'B',
      title: 'Money & Tax Basics',
      description: 'Stay compliant with IRS and state reporting—keep taxes and forms under control.',
      items: [
        {
          id: 'B1',
          label: 'Collect W-9s / Issue 1099-NEC',
          details: 'Gather W-9s from contractors and file 1099-NEC by January 31 each year.',
          link: 'https://www.irs.gov/forms-pubs/about-form-1099-nec',
          frequency: 'annually' as const,
          dueDate: new Date(new Date().getFullYear(), 0, 31).toISOString(), // January 31
        },
        {
          id: 'B2',
          label: 'Pay Quarterly Estimated Taxes',
          details: 'Pay by April 15, June 15, September 15, and January 15 to cover income and self-employment tax.',
          link: 'https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes',
          frequency: 'quarterly' as const,
        },
        {
          id: 'B3',
          label: 'Track Expenses & Deductions',
          details: 'Keep digital records of mileage, home office, supplies, and tools. Use bookkeeping software or spreadsheets.',
          frequency: 'monthly' as const,
        },
        {
          id: 'B4',
          label: 'Sales / Use Tax (if applicable)',
          details: "Apply for a California Seller's Permit if you sell taxable goods or services.",
          link: 'https://www.cdtfa.ca.gov',
          frequency: 'once' as const,
        },
      ],
    },
    {
      id: 'C',
      title: 'Protect & Stay Informed',
      description: 'Low-effort habits that keep your business safe and future-proof.',
      items: [
        {
          id: 'C1',
          label: 'Get Basic Insurance',
          details: 'Consider general or professional liability coverage. Required if hiring workers (check CA rules).',
          frequency: 'annually' as const,
        },
        {
          id: 'C2',
          label: 'Check Worker Classification',
          details: 'Learn whether you\'re an employee or contractor under IRS and CA AB-5 rules.',
          link: 'https://www.sba.gov/employee-vs-independent-contractor',
          frequency: 'once' as const,
        },
        {
          id: 'C3',
          label: 'Stay Updated on Rules',
          details: 'New IRS, DOL, or OSHA rules tagged \'small entity\' appear in the Federal Register.',
          link: 'https://www.federalregister.gov/api/v1/documents.json?conditions[term]=small%20entity',
          frequency: 'quarterly' as const,
        },
        {
          id: 'C4',
          label: 'Small Entity Compliance Guides',
          details: 'Plain-language guidance from the SBA Ombudsman on how new regulations affect small businesses.',
          link: 'https://www.sba.gov/ombudsman/compliance-guides',
          frequency: 'quarterly' as const,
        },
      ],
    },
  ],
  metadata: {
    source: 'Federal Register API, SBA Ombudsman, IRS, CDTFA, City of San Diego Socrata',
    maintainer: 'MicroAI Studios',
    region: 'San Diego County, CA',
    lastUpdated: '2025-10-16',
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function seedCompliance() {
  console.log('🌱 Seeding compliance checklist data...');

  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }

  try {
    // Insert the sole proprietor checklist
    await db.insert(complianceChecklists).values(soleProprietorChecklist);
    console.log('✅ Sole Proprietor checklist seeded successfully');

    console.log('\n📊 Seeded checklist:');
    console.log(`   ID: ${soleProprietorChecklist.id}`);
    console.log(`   Title: ${soleProprietorChecklist.title}`);
    console.log(`   Sections: ${soleProprietorChecklist.sections.length}`);
    console.log(`   Total Items: ${soleProprietorChecklist.sections.reduce((sum, s) => sum + s.items.length, 0)}`);

    console.log('\n✨ Compliance data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding compliance data:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedCompliance();

