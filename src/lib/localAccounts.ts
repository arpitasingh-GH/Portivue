import type { PortfolioEntry, Profile } from '../types/portfolio';

const ACCOUNTS_KEY = 'portivue.localAccounts.v1';
const SESSION_KEY = 'portivue.localSession.v1';
const PASSWORD_ITERATIONS = 120_000;

export interface LocalAccount {
  id: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  profile: Profile;
  entries: PortfolioEntry[];
}

function readAccounts(): LocalAccount[] {
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  if (!stored) return [];

  try {
    const accounts: unknown = JSON.parse(stored);
    if (!Array.isArray(accounts)) throw new Error('Stored account data is invalid.');
    return (accounts as LocalAccount[]).map((account) => ({
      ...account,
      entries: account.entries.map((entry) => ({
        ...entry,
        outcome: entry.outcome ?? '',
        is_published: entry.is_published ?? true,
      })),
    }));
  } catch {
    throw new Error('Could not read saved accounts. Browser storage may be damaged.');
  }
}

function encodeBytes(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function decodeBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return encodeBytes(new Uint8Array(bits));
}

export function getCurrentAccount(): LocalAccount | null {
  const accountId = localStorage.getItem(SESSION_KEY);
  if (!accountId) return null;
  return readAccounts().find((account) => account.id === accountId) ?? null;
}

export async function registerAccount(input: {
  email: string;
  password: string;
  fullName: string;
  username: string;
}): Promise<LocalAccount> {
  const accounts = readAccounts();
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();
  if (accounts.some((account) => account.email === email)) {
    throw new Error('An account with this email already exists on this browser.');
  }
  if (accounts.some((account) => account.profile.username === username)) {
    throw new Error('That username is already in use on this browser.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const account: LocalAccount = {
    id,
    email,
    passwordSalt: encodeBytes(salt),
    passwordHash: await hashPassword(input.password, salt),
    profile: {
      id,
      full_name: input.fullName.trim(),
      username,
      bio: '',
      skills: [],
      avatar_url: null,
      is_public: true,
      created_at: now,
      updated_at: now,
    },
    entries: [],
  };

  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  localStorage.setItem(SESSION_KEY, id);
  return account;
}

export async function signIn(emailInput: string, password: string): Promise<LocalAccount> {
  const email = emailInput.trim().toLowerCase();
  const account = readAccounts().find((item) => item.email === email);
  if (!account) throw new Error('No local account found for that email. Create an account on this browser first.');

  const actualHash = await hashPassword(password, decodeBytes(account.passwordSalt));
  if (actualHash !== account.passwordHash) throw new Error('That password does not match this local account.');

  localStorage.setItem(SESSION_KEY, account.id);
  return account;
}

export function saveAccount(account: LocalAccount): LocalAccount {
  const accounts = readAccounts();
  if (
    accounts.some(
      (item) => item.id !== account.id && item.profile.username === account.profile.username,
    )
  ) {
    throw new Error('That username is already in use on this browser.');
  }
  const updatedAccount = {
    ...account,
    profile: { ...account.profile, updated_at: new Date().toISOString() },
  };
  const index = accounts.findIndex((item) => item.id === account.id);
  if (index < 0) throw new Error('This local account could not be found.');
  accounts[index] = updatedAccount;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return updatedAccount;
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}
