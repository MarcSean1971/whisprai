
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
          <Heading style={h1}>Welcome to WhisprAI!</Heading>
        </Section>
        <Section style={section}>
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
}

const logo = {
  padding: '32px 48px',
  textAlign: 'center' as const,
}

const section = {
  padding: '0 48px',
}

const h1 = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#484848',
  textAlign: 'center' as const,
  padding: '0',
}

const text = {
  margin: '24px 0',
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
}

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
  margin: '24px 0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
}
