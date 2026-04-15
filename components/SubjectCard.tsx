import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Platform, ActivityIndicator } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { api } from '../services/apiService';

const COLORS = {
  background: '#F7F9FC', cardBg: '#FFFFFF', primaryBlue: '#2563EB', activeNavBg: '#EEF2FF',
  textHeader: '#1F2937', textBody: '#4B5563', textMuted: '#94A3B8', border: '#E5E7EB',
  white: '#FFFFFF', green: '#10B981', softGreen: '#D1FAE5', softPink: '#FCE7F3',
  softYellow: '#FEF3C7', softPurple: '#F3E8FF', softBlue: '#DBEAFE', softRed: '#FEE2E2',
  warningRed: '#EF4444', priceBg: '#FEF3C7',
};

interface Tuition {
  class: string; subject: string; timeFrom: string; timeTo: string;
  charge: string; day: string; board: string; skill: string; university: string; year: string;
}

interface SubjectCardProps {
  isEditable: boolean;
  selectedCategory: string;
  tuitions: Tuition[];
  tuitionCount: number;
  CHARGE_OPTIONS: string[];
  DAYS_OF_WEEK: string[];
  onTuitionChange: (tuitions: Tuition[]) => void;
  onTuitionCountChange: (count: number) => void;
  onTimingChange: (index: number, day: string, timeFrom: string, timeTo: string) => void;
  onCategoryChange?: (category: string) => void;
  styles: any;
  COLORS: any;
  isMobile: boolean;
}

const TIME_SLOTS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];
const DAYS_OF_WEEK_LIST = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const UNIVERSITY_YEARS = ['1st Year','2nd Year','3rd Year','4th Year','5th Year','6th Year'];

const SubjectCard: React.FC<SubjectCardProps> = (props) => {
  const {
    isEditable, selectedCategory, tuitions, tuitionCount,
    CHARGE_OPTIONS, DAYS_OF_WEEK, onTuitionChange, onTuitionCountChange,
    onTimingChange, onCategoryChange, isMobile,
    styles: customStyles = {},   // <-- Accept passed styles
  } = props;

  const [boardItems, setBoardItems] = useState<any[]>([]);
  const [classItems, setClassItems] = useState<any[]>([]);
  const [subjectItems, setSubjectItems] = useState<any[]>([]);
  const [universityItems, setUniversityItems] = useState<any[]>([]);
  const [skillItems, setSkillItems] = useState<any[]>([]);

  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  // Modal visibility
  const [boardModalVisible, setBoardModalVisible] = useState(false);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [chargeModalVisible, setChargeModalVisible] = useState(false);
  const [timingModalVisible, setTimingModalVisible] = useState(false);
  const [universityModalVisible, setUniversityModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);

  const [selectedTuitionIndex, setSelectedTuitionIndex] = useState<number | null>(null);
  const [selectedTimingIndex, setSelectedTimingIndex] = useState<number | null>(null);

  // Timing state
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [tempTimeFrom, setTempTimeFrom] = useState('');
  const [tempTimeTo, setTempTimeTo] = useState('');

  // Per-index cached data to avoid refetch
  const [cachedClassItems, setCachedClassItems] = useState<{ [boardId: string]: any[] }>({});
  const [cachedSubjectItems, setCachedSubjectItems] = useState<{ [key: string]: any[] }>({});
  const [cachedYearItems, setCachedYearItems] = useState<{ [uniId: string]: any[] }>({});

  const updateTuitionField = useCallback((index: number, field: string, value: string) => {
    const updated = [...tuitions];
    updated[index] = { ...updated[index], [field]: value };
    onTuitionChange(updated);
  }, [tuitions, onTuitionChange]);

  // ─── Fetch boards ──────────────────────────────────────────────────────────
  const fetchBoards = useCallback(async () => {
    if (boardItems.length > 0) return;
    setLoadingBoards(true);
    try {
      const res = await api.post('/api/allboards', { category: selectedCategory });
      if (res.success && res.data) {
        const boards = res.data.boards || [];
        const boardList = boards.map((b: any) => ({ label: b.boardName, value: b.boardName, id: b.boardId }));
        setBoardItems([{ label: 'Universities', value: 'Universities', id: 'universities' }, ...boardList]);
        if (res.data.universities && Array.isArray(res.data.universities)) {
          setUniversityItems(res.data.universities.map((u: any) => ({ label: u.universityName, value: u.universityName, id: u.universityId })));
        }
      }
    } catch (e) { console.error('fetchBoards', e); }
    finally { setLoadingBoards(false); }
  }, [selectedCategory, boardItems.length]);

  // ─── Fetch classes for a board ────────────────────────────────────────────
  const fetchClasses = useCallback(async (boardId: string) => {
    if (cachedClassItems[boardId]) { setClassItems(cachedClassItems[boardId]); return; }
    setLoadingClasses(true);
    try {
      const res = await api.post('/api/board', { boardId });
      if (res.success && res.data) {
        const items = (res.data.classes || []).map((c: any) => ({ label: c.className, value: c.className, id: c.classId }));
        setClassItems(items);
        setCachedClassItems(prev => ({ ...prev, [boardId]: items }));
      }
    } catch (e) { console.error('fetchClasses', e); }
    finally { setLoadingClasses(false); }
  }, [cachedClassItems]);

  // ─── Fetch universities ───────────────────────────────────────────────────
  const fetchUniversities = useCallback(async () => {
    if (universityItems.length > 0) return;
    setLoadingUniversities(true);
    try {
      const res = await api.post('/api/universities', {});
      if (res.success && res.data) {
        setUniversityItems(res.data.map((u: any) => ({ label: u.universityName, value: u.universityName, id: u.universityId })));
      }
    } catch (e) { console.error('fetchUniversities', e); }
    finally { setLoadingUniversities(false); }
  }, [universityItems.length]);

  // ─── Fetch years for a university ───────────────────────────────────────
  const fetchYears = useCallback(async (universityId: string) => {
    if (cachedYearItems[universityId]) return cachedYearItems[universityId];
    setLoadingYears(true);
    try {
      const res = await api.post(`/api/universities/${universityId}/years`, {});
      if (res.success && res.data) {
        const items = (res.data.years || []).map((y: any) => ({ label: y.yearName, value: y.yearName, id: y.yearId }));
        const final = items.length > 0 ? items : UNIVERSITY_YEARS.map(y => ({ label: y, value: y, id: y }));
        setCachedYearItems(prev => ({ ...prev, [universityId]: final }));
        return final;
      }
    } catch (e) { console.error('fetchYears', e); }
    finally { setLoadingYears(false); }
    const fallback = UNIVERSITY_YEARS.map(y => ({ label: y, value: y, id: y }));
    setCachedYearItems(prev => ({ ...prev, [universityId]: fallback }));
    return fallback;
  }, [cachedYearItems]);

  // ─── Fetch subjects ───────────────────────────────────────────────────────
  const fetchSubjects = useCallback(async (boardId: string, classId: string, universityId?: string, yearId?: string) => {
    const cacheKey = universityId ? `uni_${universityId}_${yearId}` : `${boardId}_${classId}`;
    if (cachedSubjectItems[cacheKey]) { setSubjectItems(cachedSubjectItems[cacheKey]); return; }
    setLoadingSubjects(true);
    try {
      let res;
      if (universityId && yearId) {
        res = await api.post(`/api/universities/${universityId}/years/${yearId}/subjects`, {});
      } else {
        res = await api.post('/api/boardId/classes', { boardId, classId });
      }
      if (res.success && res.data) {
        const items = (res.data.subjects || []).map((s: any) => ({ label: s.name, value: s.name, id: s.id }));
        setSubjectItems(items);
        setCachedSubjectItems(prev => ({ ...prev, [cacheKey]: items }));
      }
    } catch (e) { console.error('fetchSubjects', e); }
    finally { setLoadingSubjects(false); }
  }, [cachedSubjectItems]);

  // ─── Fetch skills ─────────────────────────────────────────────────────────
  const fetchSkills = useCallback(async () => {
    if (skillItems.length > 0) return;
    try {
      const res = await api.post('/api/allboards', { category: 'Skill teacher' });
      if (res.success && res.data) {
        const skills = res.data.skills || res.data || [];
        setSkillItems(skills.map((s: any) => ({ label: s.name || s.boardName, value: s.name || s.boardName })));
      }
    } catch (e) { console.error('fetchSkills', e); }
  }, [skillItems.length]);

  useEffect(() => {
    if (selectedCategory === 'Subject teacher') { fetchBoards(); }
    else if (selectedCategory === 'Skill teacher') { fetchSkills(); }
  }, [selectedCategory]);

  // ─── Open handlers ────────────────────────────────────────────────────────
  const openBoardModal = useCallback((index: number) => {
    setSelectedTuitionIndex(index);
    setBoardModalVisible(true);
  }, []);

  const openClassModal = useCallback(async (index: number) => {
    setSelectedTuitionIndex(index);
    const tuition = tuitions[index];
    if (!tuition?.board) { alert('Please select a board first.'); return; }
    const board = boardItems.find(b => b.value === tuition.board);
    if (board?.id) await fetchClasses(board.id);
    setClassModalVisible(true);
  }, [tuitions, boardItems, fetchClasses]);

  const openUniversityModal = useCallback((index: number) => {
    setSelectedTuitionIndex(index);
    setUniversityModalVisible(true);
  }, []);

  const openYearModal = useCallback(async (index: number) => {
    setSelectedTuitionIndex(index);
    const tuition = tuitions[index];
    if (!tuition?.university) { alert('Please select a university first.'); return; }
    const uni = universityItems.find(u => u.value === tuition.university);
    if (uni?.id) {
      const years = await fetchYears(uni.id);
      if (years) setCachedYearItems(prev => ({ ...prev, [uni.id]: years }));
    } else {
      setCachedYearItems(prev => ({ ...prev, ['_fallback']: UNIVERSITY_YEARS.map(y => ({ label: y, value: y, id: y })) }));
    }
    setYearModalVisible(true);
  }, [tuitions, universityItems, fetchYears]);

  const openSubjectModal = useCallback(async (index: number) => {
    setSelectedTuitionIndex(index);
    const tuition = tuitions[index];
    if (tuition?.board === 'Universities') {
      if (!tuition.university || !tuition.year) { alert('Please select university and year first.'); return; }
      const uni = universityItems.find(u => u.value === tuition.university);
      const yearsForUni = uni?.id ? (cachedYearItems[uni.id] || []) : UNIVERSITY_YEARS.map(y => ({ label: y, value: y, id: y }));
      const yr = yearsForUni.find((y: any) => y.value === tuition.year);
      if (uni?.id) await fetchSubjects(uni.id, '', uni.id, yr?.id || tuition.year);
    } else {
      if (!tuition.class) { alert('Please select a class first.'); return; }
      const board = boardItems.find(b => b.value === tuition.board);
      const cls = classItems.find(c => c.value === tuition.class);
      if (board?.id && cls?.id) await fetchSubjects(board.id, cls.id);
    }
    setSubjectModalVisible(true);
  }, [tuitions, universityItems, cachedYearItems, boardItems, classItems, fetchSubjects]);

  const openSkillModal = useCallback((index: number) => { setSelectedTuitionIndex(index); setSkillModalVisible(true); }, []);
  const openChargeModal = useCallback((index: number) => { setSelectedTuitionIndex(index); setChargeModalVisible(true); }, []);
  const openTimingModal = useCallback((index: number) => {
    setSelectedTimingIndex(index);
    const t = tuitions[index];
    setSelectedDays(t?.day ? t.day.split(', ').filter(Boolean) : []);
    setTempTimeFrom(t?.timeFrom || '');
    setTempTimeTo(t?.timeTo || '');
    setTimingModalVisible(true);
  }, [tuitions]);

  // ─── Select handlers ──────────────────────────────────────────────────────
  const handleBoardSelect = useCallback(async (boardName: string, boardId?: string) => {
    if (selectedTuitionIndex === null) return;
    const updated = [...tuitions];
    updated[selectedTuitionIndex] = { ...updated[selectedTuitionIndex], board: boardName, class: '', subject: '', university: '', year: '' };
    onTuitionChange(updated);
    setBoardModalVisible(false);
    if (boardId && boardName !== 'Universities') await fetchClasses(boardId);
    if (boardName === 'Universities') await fetchUniversities();
  }, [selectedTuitionIndex, tuitions, onTuitionChange, fetchClasses, fetchUniversities]);

  const handleClassSelect = useCallback((className: string, classId?: string) => {
    if (selectedTuitionIndex === null) return;
    const updated = [...tuitions];
    updated[selectedTuitionIndex] = { ...updated[selectedTuitionIndex], class: className, subject: '' };
    onTuitionChange(updated);
    setClassModalVisible(false);
  }, [selectedTuitionIndex, tuitions, onTuitionChange]);

  const handleUniversitySelect = useCallback(async (uniName: string, uniId?: string) => {
    if (selectedTuitionIndex === null) return;
    const updated = [...tuitions];
    updated[selectedTuitionIndex] = { ...updated[selectedTuitionIndex], university: uniName, year: '', subject: '' };
    onTuitionChange(updated);
    setUniversityModalVisible(false);
    if (uniId) await fetchYears(uniId);
  }, [selectedTuitionIndex, tuitions, onTuitionChange, fetchYears]);

  const handleYearSelect = useCallback((yearName: string, yearId?: string) => {
    if (selectedTuitionIndex === null) return;
    const updated = [...tuitions];
    updated[selectedTuitionIndex] = { ...updated[selectedTuitionIndex], year: yearName, subject: '' };
    onTuitionChange(updated);
    setYearModalVisible(false);
  }, [selectedTuitionIndex, tuitions, onTuitionChange]);

  const handleSubjectSelect = useCallback((subjectName: string) => {
    if (selectedTuitionIndex === null) return;
    updateTuitionField(selectedTuitionIndex, 'subject', subjectName);
    setSubjectModalVisible(false);
  }, [selectedTuitionIndex, updateTuitionField]);

  const handleSkillSelect = useCallback((skillName: string) => {
    if (selectedTuitionIndex === null) return;
    updateTuitionField(selectedTuitionIndex, 'skill', skillName);
    setSkillModalVisible(false);
  }, [selectedTuitionIndex, updateTuitionField]);

  const handleChargeSelect = useCallback((charge: string) => {
    if (selectedTuitionIndex === null) return;
    updateTuitionField(selectedTuitionIndex, 'charge', charge);
    setChargeModalVisible(false);
  }, [selectedTuitionIndex, updateTuitionField]);

  const saveTiming = useCallback(() => {
    if (selectedTimingIndex === null) return;
    if (selectedDays.length === 0) { alert('Please select at least one day.'); return; }
    if (!tempTimeFrom || !tempTimeTo) { alert('Please select start and end time.'); return; }
    onTimingChange(selectedTimingIndex, selectedDays.join(', '), tempTimeFrom, tempTimeTo);
    setTimingModalVisible(false);
  }, [selectedTimingIndex, selectedDays, tempTimeFrom, tempTimeTo, onTimingChange]);

  const addTuition = useCallback(() => {
    onTuitionCountChange(tuitionCount + 1);
    onTuitionChange([...tuitions, { class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: '', university: '', year: '' }]);
  }, [tuitionCount, tuitions, onTuitionCountChange, onTuitionChange]);

  const deleteTuition = useCallback((index: number) => {
    onTuitionChange(tuitions.filter((_, i) => i !== index));
    onTuitionCountChange(Math.max(0, tuitionCount - 1));
  }, [tuitionCount, tuitions, onTuitionChange, onTuitionCountChange]);

  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return t;
    const p = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${p}`;
  };

  const getYearItems = (universityValue: string) => {
    const uni = universityItems.find(u => u.value === universityValue);
    if (uni?.id && cachedYearItems[uni.id]) return cachedYearItems[uni.id];
    return UNIVERSITY_YEARS.map(y => ({ label: y, value: y, id: y }));
  };

  const visibleTuitions = isEditable
    ? tuitions.slice(0, tuitionCount)
    : tuitions.slice(0, tuitionCount).filter(t => t.class || t.subject || t.skill || t.board || t.university || t.timeFrom || t.day || t.charge);

  // Merge custom grid and card styles
  const gridStyle = [s.grid, customStyles.subjGrid, isMobile && { flexDirection: 'column' }];
  const cardStyle = [s.card, customStyles.subjectCard, isMobile && { width: '100%', marginHorizontal: 0 }];

  return (
    <>
      {/* ── Category Tabs ─────────────────────────────────────────────── */}
      <View style={s.tabWrap}>
        <View style={s.seg}>
          {['Subject teacher', 'Skill teacher'].map(cat => (
            <TouchableOpacity
              key={cat}
              style={[s.segBtn, selectedCategory === cat && s.segBtnActive]}
              onPress={() => isEditable && onCategoryChange && onCategoryChange(cat)}
            >
              <Text style={[s.segTxt, selectedCategory === cat && s.segTxtActive]}>{cat === 'Subject teacher' ? 'Subject Teacher' : 'Skill Teacher'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Cards Grid (now using passed styles) ────────────────────────── */}
      <View style={gridStyle}>
        {visibleTuitions.map((tuition) => {
          const index = tuitions.indexOf(tuition);
          let cardTitle: string;
          if (selectedCategory === 'Skill teacher') {
            cardTitle = tuition.skill || `Skill ${index + 1}`;
          } else if (tuition.board === 'Universities') {
            if (tuition.subject && tuition.university) {
              const yearPart = tuition.year ? ` (${tuition.year})` : '';
              cardTitle = `${tuition.subject} – ${tuition.university}${yearPart}`;
            } else {
              cardTitle = `Subject ${index + 1}`;
            }
          } else {
            cardTitle = (tuition.subject && tuition.class) ? `${tuition.subject} – ${tuition.class}` : `Subject ${index + 1}`;
          }

          return (
            <View key={index} style={cardStyle}>
              {/* Card Header */}
              <View style={s.cardHead}>
                <View style={s.iconBox}>
                  <FontAwesome5 name={selectedCategory === 'Skill teacher' ? 'tools' : 'book'} size={14} color="#D97706" />
                </View>
                <Text style={s.cardTitle} numberOfLines={2}>{cardTitle}</Text>
                {isEditable && (
                  <TouchableOpacity onPress={() => deleteTuition(index)} style={s.deleteBtn}>
                    <MaterialCommunityIcons name="trash-can" size={20} color={COLORS.warningRed} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Meta Row */}
              <View style={s.metaRow}>
                <View style={s.metaBox}><Text style={s.metaTxt}>{formatTime(tuition.timeFrom) || '—'}</Text></View>
                <View style={s.metaBox}><Text style={s.metaTxt}>{formatTime(tuition.timeTo) || '—'}</Text></View>
                <View style={[s.metaBox, { backgroundColor: COLORS.priceBg }]}>
                  <Text style={s.metaTxt}>{tuition.charge || 'Charge'}</Text>
                </View>
              </View>

              {/* Days Row */}
              <View style={s.daysRow}>
                {tuition.day ? tuition.day.split(', ').filter(Boolean).map(d => (
                  <View key={d} style={s.dayPill}><Text style={s.dayTxt}>{d.substring(0, 3)}</Text></View>
                )) : <Text style={s.metaTxt}>No days set</Text>}
              </View>

              {/* Mode Row */}
              <View style={s.modeRow}>
                <Text style={s.modeLabel}>I will Teach</Text>
                <View style={s.modeBtns}>
                  <View style={s.modeBtnGreen}><Text style={s.modeBtnTxt}>Online</Text></View>
                  <View style={s.modeBtnPink}><Text style={s.modeBtnTxt}>Face to Face</Text></View>
                </View>
              </View>

              {/* ── Editable Dropdowns ──────────────────────────────── */}
              {isEditable && (
                <View style={s.dropdowns}>
                  {selectedCategory === 'Subject teacher' && (
                    <>
                      <TouchableOpacity style={s.dropRow} onPress={() => openBoardModal(index)}>
                        <Text style={s.dropLabel}>Board</Text>
                        <View style={s.dropBox}>
                          <Text style={[s.dropTxt, !tuition.board && s.dropPlaceholder]}>{tuition.board || 'Select Board'}</Text>
                          <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                        </View>
                      </TouchableOpacity>

                      {tuition.board === 'Universities' ? (
                        <>
                          <TouchableOpacity style={s.dropRow} onPress={() => openUniversityModal(index)}>
                            <Text style={s.dropLabel}>University</Text>
                            <View style={s.dropBox}>
                              <Text style={[s.dropTxt, !tuition.university && s.dropPlaceholder]} numberOfLines={1}>{tuition.university || 'Select University'}</Text>
                              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity style={s.dropRow} onPress={() => openYearModal(index)}>
                            <Text style={s.dropLabel}>Year</Text>
                            <View style={s.dropBox}>
                              <Text style={[s.dropTxt, !tuition.year && s.dropPlaceholder]}>{tuition.year || 'Select Year'}</Text>
                              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                            </View>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity style={s.dropRow} onPress={() => openClassModal(index)}>
                          <Text style={s.dropLabel}>Class</Text>
                          <View style={s.dropBox}>
                            <Text style={[s.dropTxt, !tuition.class && s.dropPlaceholder]}>{tuition.class || 'Select Class'}</Text>
                            <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                          </View>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity style={s.dropRow} onPress={() => openSubjectModal(index)}>
                        <Text style={s.dropLabel}>Subject</Text>
                        <View style={s.dropBox}>
                          <Text style={[s.dropTxt, !tuition.subject && s.dropPlaceholder]}>{tuition.subject || 'Select Subject'}</Text>
                          <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                        </View>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedCategory === 'Skill teacher' && (
                    <TouchableOpacity style={s.dropRow} onPress={() => openSkillModal(index)}>
                      <Text style={s.dropLabel}>Skill</Text>
                      <View style={s.dropBox}>
                        <Text style={[s.dropTxt, !tuition.skill && s.dropPlaceholder]}>{tuition.skill || 'Select Skill'}</Text>
                        <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                      </View>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={s.dropRow} onPress={() => openChargeModal(index)}>
                    <Text style={s.dropLabel}>Charge</Text>
                    <View style={s.dropBox}>
                      <Text style={[s.dropTxt, !tuition.charge && s.dropPlaceholder]}>{tuition.charge || 'Select Charge'}</Text>
                      <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={s.dropRow} onPress={() => openTimingModal(index)}>
                    <Text style={s.dropLabel}>Timing</Text>
                    <View style={s.dropBox}>
                      <Text style={[s.dropTxt, !tuition.day && s.dropPlaceholder]} numberOfLines={1}>
                        {tuition.day && tuition.timeFrom && tuition.timeTo ? `${tuition.day} • ${formatTime(tuition.timeFrom)}–${formatTime(tuition.timeTo)}` : 'Select Timing'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {isEditable && (
          <TouchableOpacity style={[s.addBtn, customStyles.addButton]} onPress={addTuition}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primaryBlue} />
            <Text style={s.addBtnTxt}>Add Subject / Skill</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ════════════════ MODALS (unchanged) ════════════════════════════════════ */}
      {/* Board Modal */}
      <Modal animationType="slide" transparent visible={boardModalVisible} onRequestClose={() => setBoardModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Select Board</Text>
              <TouchableOpacity onPress={() => setBoardModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textHeader} /></TouchableOpacity>
            </View>
            <ScrollView style={s.sheetList}>
              {loadingBoards ? <ActivityIndicator size="large" color={COLORS.primaryBlue} style={s.loader} /> :
                boardItems.map(b => (
                  <TouchableOpacity key={b.id || b.value} style={s.sheetItem} onPress={() => handleBoardSelect(b.value, b.id)}>
                    <Text style={s.sheetItemTxt}>{b.label}</Text>
                    {tuitions[selectedTuitionIndex ?? 0]?.board === b.value ? <Ionicons name="checkmark" size={18} color={COLORS.primaryBlue} /> : null}
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Class Modal */}
      <Modal animationType="slide" transparent visible={classModalVisible} onRequestClose={() => setClassModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setClassModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textHeader} /></TouchableOpacity>
            </View>
            <ScrollView style={s.sheetList}>
              {loadingClasses ? <ActivityIndicator size="large" color={COLORS.primaryBlue} style={s.loader} /> :
                classItems.length === 0 ? <Text style={s.emptyTxt}>No classes available</Text> :
                classItems.map(c => (
                  <TouchableOpacity key={c.id || c.value} style={s.sheetItem} onPress={() => handleClassSelect(c.value, c.id)}>
                    <Text style={s.sheetItemTxt}>{c.label}</Text>
                    {tuitions[selectedTuitionIndex ?? 0]?.class === c.value ? <Ionicons name="checkmark" size={18} color={COLORS.primaryBlue} /> : null}
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* University Modal */}
      <Modal animationType="slide" transparent visible={universityModalVisible} onRequestClose={() => setUniversityModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Select University</Text>
              <TouchableOpacity onPress={() => setUniversityModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textHeader} /></TouchableOpacity>
            </View>
            <ScrollView style={s.sheetList}>
              {loadingUniversities ? <ActivityIndicator size="large" color={COLORS.primaryBlue} style={s.loader} /> :
                universityItems.length === 0 ? <Text style={s.emptyTxt}>No universities found</Text> :
                universityItems.map(u => (
                  <TouchableOpacity key={u.id || u.value} style={s.sheetItem} onPress={() => handleUniversitySelect(u.value, u.id)}>
                    <Text style={s.sheetItemTxt}>{u.label}</Text>
                    {tuitions[selectedTuitionIndex ?? 0]?.university === u.value ? <Ionicons name="checkmark" size={18} color={COLORS.primaryBlue} /> : null}
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Year Modal */}
      <Modal animationType="slide" transparent visible={yearModalVisible} onRequestClose={() => setYearModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setYearModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textHeader} /></TouchableOpacity>
            </View>
            <ScrollView style={s.sheetList}>
              {loadingYears ? <ActivityIndicator size="large" color={COLORS.primaryBlue} style={s.loader} /> : (() => {
                const tuition = tuitions[selectedTuitionIndex ?? 0];
                const yearList = tuition?.university ? getYearItems(tuition.university) : UNIVERSITY_YEARS.map(y => ({ label: y, value: y, id: y }));
                return yearList.map((yr: any) => (
                  <TouchableOpacity key={yr.id || yr.value} style={s.sheetItem} onPress={() => handleYearSelect(yr.value, yr.id)}>
                    <Text style={s.sheetItemTxt}>{yr.label}</Text>
                    {tuition?.year === yr.value ? <Ionicons name="checkmark" size={18} color={COLORS.primaryBlue} /> : null}
                  </TouchableOpacity>
                ));
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subject Modal */}
      <Modal animationType="slide" transparent visible={subjectModalVisible} onRequestClose={() => setSubjectModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Select Subject</Text>
              <TouchableOpacity onPress={() => setSubjectModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textHeader} /></TouchableOpacity>
            </View>
            <ScrollView style={s.sheetList}>
              {loadingSubjects ? <ActivityIndicator size="large" color={COLORS.primaryBlue} style={s.loader} /> :
                subjectItems.length === 0 ? <Text style={s.emptyTxt}>No subjects available</Text> :
                subjectItems.map(sub => (
                  <TouchableOpacity key={sub.id || sub.value} style={s.sheetItem} onPress={() => handleSubjectSelect(sub.value)}>
                    <Text style={s.sheetItemTxt}>{sub.label}</Text>
                    {tuitions[selectedTuitionIndex ?? 0]?.subject === sub.value ? <Ionicons name="checkmark" size={18} color={COLORS.primaryBlue} /> : null}
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Skill Modal */}
      <Modal animationType="slide" transparent visible={skillModalVisible} onRequestClose={() => setSkillModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Select Skill</Text>
              <TouchableOpacity onPress={() => setSkillModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textHeader} /></TouchableOpacity>
            </View>
            <ScrollView style={s.sheetList}>
              {skillItems.length === 0 ? <ActivityIndicator size="large" color={COLORS.primaryBlue} style={s.loader} /> :
                skillItems.map(sk => (
                  <TouchableOpacity key={sk.value} style={s.sheetItem} onPress={() => handleSkillSelect(sk.value)}>
                    <Text style={s.sheetItemTxt}>{sk.label}</Text>
                    {tuitions[selectedTuitionIndex ?? 0]?.skill === sk.value ? <Ionicons name="checkmark" size={18} color={COLORS.primaryBlue} /> : null}
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Charge Modal */}
      <Modal animationType="slide" transparent visible={chargeModalVisible} onRequestClose={() => setChargeModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Select Monthly Charge</Text>
              <TouchableOpacity onPress={() => setChargeModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textHeader} /></TouchableOpacity>
            </View>
            <ScrollView style={s.sheetList}>
              {CHARGE_OPTIONS.map(ch => (
                <TouchableOpacity key={ch} style={s.sheetItem} onPress={() => handleChargeSelect(ch)}>
                  <Text style={s.sheetItemTxt}>{ch}</Text>
                  {tuitions[selectedTuitionIndex ?? 0]?.charge === ch ? <Ionicons name="checkmark" size={18} color={COLORS.primaryBlue} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Timing Modal */}
      <Modal animationType="slide" transparent visible={timingModalVisible} onRequestClose={() => setTimingModalVisible(false)}>
        <View style={s.overlay}>
          <View style={[s.sheet, { maxHeight: '90%' }]}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Select Timing</Text>
              <TouchableOpacity onPress={() => setTimingModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.textHeader} /></TouchableOpacity>
            </View>
            <ScrollView style={s.sheetList} showsVerticalScrollIndicator={false}>
              <Text style={s.sectionLabel}>Select Days</Text>
              <View style={s.daysGrid}>
                {DAYS_OF_WEEK_LIST.map(day => {
                  const active = selectedDays.includes(day);
                  return (
                    <TouchableOpacity key={day} style={[s.dayBtn, active && s.dayBtnActive]} onPress={() => setSelectedDays(prev => active ? prev.filter(d => d !== day) : [...prev, day])}>
                      <Text style={[s.dayBtnTxt, active && s.dayBtnTxtActive]}>{day.substring(0, 3)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={s.sectionLabel}>Start Time</Text>
              <View style={s.timeSlotsWrap}>
                {TIME_SLOTS.map(slot => (
                  <TouchableOpacity key={`from_${slot}`} style={[s.timeSlot, tempTimeFrom === slot && s.timeSlotActive]} onPress={() => setTempTimeFrom(slot)}>
                    <Text style={[s.timeSlotTxt, tempTimeFrom === slot && s.timeSlotTxtActive]}>{formatTime(slot)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.sectionLabel}>End Time</Text>
              <View style={s.timeSlotsWrap}>
                {TIME_SLOTS.map(slot => (
                  <TouchableOpacity key={`to_${slot}`} style={[s.timeSlot, tempTimeTo === slot && s.timeSlotActive]} onPress={() => setTempTimeTo(slot)}>
                    <Text style={[s.timeSlotTxt, tempTimeTo === slot && s.timeSlotTxtActive]}>{formatTime(slot)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(selectedDays.length > 0 || tempTimeFrom || tempTimeTo) ? (
                <View style={s.timingSummary}>
                  {selectedDays.length > 0 ? <Text style={s.timingSummaryTxt}>📅 {selectedDays.join(', ')}</Text> : null}
                  {tempTimeFrom && tempTimeTo ? <Text style={s.timingSummaryTxt}>🕐 {formatTime(tempTimeFrom)} – {formatTime(tempTimeTo)}</Text> : null}
                </View>
              ) : null}

              <TouchableOpacity style={s.saveBtn} onPress={saveTiming}>
                <Text style={s.saveBtnTxt}>Confirm Timing</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const s = StyleSheet.create({
  tabWrap: { marginBottom: 28 },
  seg: { flexDirection: 'row', backgroundColor: '#E0E7FF', borderRadius: 14, padding: 5, alignSelf: 'flex-start' },
  segBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  segBtnActive: { backgroundColor: COLORS.green },
  segTxt: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  segTxtActive: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  card: { flex: 1, minWidth: 260, backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#C6E3FF', ...Platform.select({ web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 5 } }) },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, minHeight: 48 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginRight: 10, flexShrink: 0 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.textHeader, flexWrap: 'wrap', lineHeight: 22 },
  deleteBtn: { padding: 4 },
  metaRow: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap', gap: 6 },
  metaBox: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  metaTxt: { fontSize: 12, fontWeight: '600', color: COLORS.textHeader },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 14 },
  dayPill: { backgroundColor: COLORS.softGreen, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dayTxt: { fontSize: 11, fontWeight: '700', color: COLORS.green },
  modeRow: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  modeLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textHeader, marginBottom: 8 },
  modeBtns: { flexDirection: 'row', gap: 8 },
  modeBtnGreen: { flex: 1, backgroundColor: COLORS.softGreen, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnPink: { flex: 1, backgroundColor: COLORS.softPink, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  modeBtnTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textHeader },
  dropdowns: { marginTop: 18, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16, gap: 10 },
  dropRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textBody, width: 72 },
  dropBox: { flex: 1, backgroundColor: '#F3F4FB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropTxt: { fontSize: 13, color: COLORS.textHeader, flex: 1 },
  dropPlaceholder: { color: COLORS.textMuted },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 10, padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.primaryBlue, backgroundColor: COLORS.white, width: Platform.OS === 'web' ? 'calc(50% - 20px)' : '95%', gap: 8, alignSelf: 'center' },
  addBtnTxt: { fontSize: 15, fontWeight: '600', color: COLORS.primaryBlue },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, maxHeight: '80%' },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textHeader },
  sheetList: { paddingHorizontal: 4 },
  sheetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sheetItemTxt: { fontSize: 15, color: COLORS.textHeader, flex: 1 },
  loader: { paddingVertical: 40 },
  emptyTxt: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: 30, fontSize: 14 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textHeader, paddingHorizontal: 20, marginTop: 18, marginBottom: 10 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  dayBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: COLORS.border },
  dayBtnActive: { backgroundColor: COLORS.primaryBlue, borderColor: COLORS.primaryBlue },
  dayBtnTxt: { fontSize: 13, fontWeight: '600', color: COLORS.textBody },
  dayBtnTxtActive: { color: COLORS.white },
  timeSlotsWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  timeSlot: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: COLORS.border, minWidth: 80, alignItems: 'center' },
  timeSlotActive: { backgroundColor: '#F5B726', borderColor: '#F5B726' },
  timeSlotTxt: { fontSize: 13, fontWeight: '600', color: COLORS.textBody },
  timeSlotTxtActive: { color: '#1F2937' },
  timingSummary: { marginHorizontal: 20, marginTop: 14, padding: 14, backgroundColor: '#EEF2FF', borderRadius: 12, gap: 6 },
  timingSummaryTxt: { fontSize: 13, color: COLORS.primaryBlue, fontWeight: '600' },
  saveBtn: { margin: 20, marginTop: 16, backgroundColor: COLORS.primaryBlue, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  saveBtnTxt: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});

export default SubjectCard;