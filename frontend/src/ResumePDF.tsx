import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts for better look
Font.register({
  family: 'Open Sans',
  src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf'
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#333',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  contact: {
    marginTop: 5,
    fontSize: 10,
    color: '#64748b',
    flexDirection: 'row',
    gap: 10,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  text: {
    marginBottom: 5,
    lineHeight: 1.5,
  },
  experienceItem: {
    marginBottom: 12,
  },
  jobTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#1e293b',
  },
  companyDate: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skillTag: {
    backgroundColor: '#f1f5f9',
    padding: '2 6',
    borderRadius: 4,
    fontSize: 9,
    color: '#475569',
  }
});

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  experiences: {
    title: string;
    company: string;
    date: string;
    description: string;
  }[];
  skills: string[];
}

export const ResumePDF = ({ data }: { data: ResumeData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.name || 'Seu Nome'}</Text>
        <View style={styles.contact}>
          <Text>{data.email || 'seu.email@exemplo.com'}</Text>
          <Text>{data.phone || '(00) 00000-0000'}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo Profissional</Text>
        <Text style={styles.text}>{data.summary || 'Escreva aqui um breve resumo da sua carreira e objetivos...'}</Text>
      </View>

      {/* Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experiência Profissional</Text>
        {data.experiences.map((exp, i) => (
          <View key={i} style={styles.experienceItem}>
            <Text style={styles.jobTitle}>{exp.title || 'Cargo / Função'}</Text>
            <Text style={styles.companyDate}>{exp.company || 'Empresa'} | {exp.date || 'Período'}</Text>
            <Text style={styles.text}>{exp.description || 'Descreva suas principais responsabilidades e conquistas.'}</Text>
          </View>
        ))}
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habilidades e Competências</Text>
        <View style={styles.skillsContainer}>
          {data.skills.map((skill, i) => (
            <Text key={i} style={styles.skillTag}>{skill}</Text>
          ))}
        </View>
      </View>
    </Page>
  </Document>
);
