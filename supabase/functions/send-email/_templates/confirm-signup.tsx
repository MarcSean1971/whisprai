
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.12'
import * as React from 'npm:react@18.2.0'

interface ConfirmSignupEmailProps {
  confirmationUrl: string;
  email: string;
}

export const ConfirmSignupEmail = ({
  confirmationUrl,
  email,
}: ConfirmSignupEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your WhisprAI account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logo}>
          <div style={logoWrapper}>
            <div style={logoIcon}>
              <img
                src="https://whisprai.app/logo.svg"
                width="32"
                height="32"
                alt="WhisprAI"
                style={logoImage}
              />
            </div>
            <span style={logoText}>
              Whispr<span style={{ color: '#7C4DFF' }}>AI</span>
            </span>
          </div>
        </Section>
        <Section style={section}>
          <Heading style={h1}>Welcome to WhisprAI!</Heading>
          <Text style={text}>
            Thanks for signing up! Please confirm your email address ({email}) to
            get full access to WhisprAI.
          </Text>
          <Link href={confirmationUrl} style={button}>
            Confirm Email Address
          </Link>
          <Text style={text}>
            If you didn't create an account with WhisprAI, you can safely ignore
            this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            This link will expire in 24 hours. If you need a new confirmation
            link, please sign in again to receive a new one.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ConfirmSignupEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
}

const logo = {
  padding: '32px 48px 24px',
  textAlign: 'center' as const,
}

const logoWrapper = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
}

const logoIcon = {
  backgroundColor: '#7C4DFF',
  borderRadius: '8px',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const logoImage = {
  width: '20px',
  height: '20px',
}

const logoText = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1A1F2C',
}

const section = {
  padding: '0 48px',
}

const h1 = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1A1F2C',
  textAlign: 'center' as const,
  padding: '0',
  margin: '0 0 24px',
}

const text = {
  margin: '24px 0',
  color: '#4B5563',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
}

const button = {
  backgroundColor: '#7C4DFF',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '32px 0',
  transition: 'background-color 0.2s ease',
}

const hr = {
  borderColor: '#E5E7EB',
  margin: '32px 0',
}

const footer = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '20px',
}

