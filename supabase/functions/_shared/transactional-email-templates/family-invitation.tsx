import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface FamilyInvitationEmailProps {
  inviteLink?: string
  role?: string
  familyName?: string
  inviterEmail?: string
  expiresAt?: string
}

const FamilyInvitationEmail = ({
  inviteLink,
  role,
  familyName,
  inviterEmail,
  expiresAt,
}: FamilyInvitationEmailProps) => {
  const label = familyName ? `the ${familyName} family` : 'a family'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You’ve been invited to join MoneyBloom</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>You’re invited to MoneyBloom</Heading>
          <Text style={text}>
            {inviterEmail ? `${inviterEmail} invited you to join` : 'You’ve been invited to join'} {label}.
          </Text>
          {role ? (
            <Text style={metaText}>
              Assigned role: <strong>{role}</strong>
            </Text>
          ) : null}
          {inviteLink ? (
            <Section style={buttonWrap}>
              <Button href={inviteLink} style={button}>
                Accept invitation
              </Button>
            </Section>
          ) : null}
          <Text style={hintText}>
            If the button doesn’t work, copy and paste this link into your browser:
          </Text>
          <Text style={linkText}>{inviteLink ?? 'Invite link unavailable'}</Text>
          {expiresAt ? <Text style={hintText}>This invitation expires on {new Date(expiresAt).toLocaleString()}.</Text> : null}
          <Text style={footer}>MoneyBloom</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FamilyInvitationEmail,
  subject: (data: Record<string, any>) =>
    `You’ve been invited to ${data.familyName ? `${data.familyName} on ` : ''}MoneyBloom`,
  displayName: 'Family invitation',
  previewData: {
    inviteLink: 'https://shine-coin.lovable.app/accept-invite?token=example-token',
    role: 'adult',
    familyName: 'MoneyBloom Family',
    inviterEmail: 'owner@moneybloom.me',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '28px 24px',
  maxWidth: '560px',
}

const heading = {
  color: '#0f172a',
  fontSize: '26px',
  lineHeight: '1.3',
  margin: '0 0 14px',
}

const text = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '1.55',
  margin: '0 0 10px',
}

const metaText = {
  color: '#0f172a',
  fontSize: '14px',
  margin: '0 0 14px',
}

const buttonWrap = {
  margin: '22px 0 18px',
}

const button = {
  backgroundColor: '#0f172a',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 18px',
  textDecoration: 'none',
}

const hintText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 8px',
}

const linkText = {
  color: '#0f172a',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 14px',
  wordBreak: 'break-all' as const,
}

const footer = {
  color: '#94a3b8',
  fontSize: '12px',
  marginTop: '20px',
}
