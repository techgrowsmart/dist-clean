import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Image, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import TeacherWebHeader from '../ui/TeacherWebHeader';
import TeacherWebSidebar from '../ui/TeacherWebSidebar';
import { getAuthData } from '../../utils/authStorage';
import { useRouter } from 'expo-router';
// ReactDOM only imported on web at runtime to avoid native crash
let ReactDOM: any = null;
if (Platform.OS === 'web') {
  ReactDOM = require('react-dom');
}

const COLORS = {
  background: '#F7F9FC', cardBg: '#FFFFFF', primaryBlue: '#2563EB', chartDark: '#0F172A',
  posBlue: '#3B82F6', negPink: '#FF4B91', textHeader: '#1F2937', textBody: '#4B5563',
  textMuted: '#94A3B8', border: '#E5E7EB', white: '#FFFFFF', successGreen: '#10B981',
};

export const STATES: string[] = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi (NCT)','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

export const CITIES_BY_STATE: Record<string, string[]> = {
  'Andhra Pradesh': [
    'Visakhapatnam','Vijayawada','Guntur','Nellore','Kurnool','Kakinada','Tirupati',
    'Rajahmundry','Kadapa','Anantapur','Vizianagaram','Eluru','Ongole','Nandyal',
    'Machilipatnam','Adoni','Tenali','Proddatur','Chittoor','Hindupur','Srikakulam',
    'Bhimavaram','Tadepalligudem','Guntakal','Dharmavaram','Gudivada','Narasaraopet',
    'Tadipatri','Amaravati','Mangalagiri','Puttaparthi','Madanapalle','Nagari',
    'Sullurpeta','Markapur','Chirala','Bapatla','Palasa','Jaganmohan Reddy Nagar',
  ],
  'Arunachal Pradesh': [
    'Itanagar','Naharlagun','Pasighat','Tezpur','Ziro','Bomdila','Along','Tezu',
    'Khonsa','Roing','Aalo','Namsai','Changlang','Seppa','Daporijo','Anini',
    'Yingkiong','Tawang','Dirang','Mechuka',
  ],
  'Assam': [
    'Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia','Tezpur',
    'Karimganj','Lakhimpur','Hailakandi','Dhubri','Goalpara','Bongaigaon',
    'Kokrajhar','Sivasagar','Golaghat','Morigaon','Nalbari','Barpeta','Hojai',
    'Mangaldai','Diphu','Haflong','Lumding','Dhemaji','Majuli','Biswanath',
    'Charaideo','South Salmara','West Karbi Anglong','Kamrup','Darrang',
  ],
  'Bihar': [
    'Patna','Gaya','Bhagalpur','Muzaffarpur','Purnia','Darbhanga','Ara','Begusarai',
    'Katihar','Munger','Chhapra','Saharsa','Sitamarhi','Hajipur','Siwan','Motihari',
    'Nawada','Bettiah','Aurangabad','Sasaram','Dehri','Kishanganj','Jehanabad',
    'Buxar','Madhubani','Samastipur','Supaul','Khagaria','Gopalganj','Sheikhpura',
    'Araria','Madhepura','Jamui','Sheohar','Banka','Lakhisarai','Vaishali',
    'Rohtas','Kaimur','West Champaran','East Champaran',
  ],
  'Chhattisgarh': [
    'Raipur','Bhilai','Bilaspur','Korba','Durg','Rajnandgaon','Jagdalpur',
    'Raigarh','Ambikapur','Chirmiri','Dhamtari','Mahasamund','Champa','Kanker',
    'Kondagaon','Narayanpur','Bemetara','Balod','Mungeli','Gariaband',
    'Kabirdham','Sukma','Bijapur','Balrampur','Janjgir','Korea','Surajpur',
  ],
  'Goa': [
    'Panaji','Margao','Vasco da Gama','Mapusa','Ponda','Bicholim','Canacona',
    'Curchorem','Pernem','Sanguem','Quepem','Sanquelim','Calangute','Anjuna',
    'Baga','Colva','Old Goa','Valpoi','Cuncolim',
  ],
  'Gujarat': [
    'Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Gandhinagar',
    'Junagadh','Anand','Navsari','Morbi','Nadiad','Surendranagar','Bharuch',
    'Mehsana','Botad','Amreli','Deesa','Palanpur','Vapi','Dahod','Godhra',
    'Porbandar','Dwarka','Patan','Himmatnagar','Veraval','Gondal','Jetpur',
    'Bhuj','Gandhidham','Mundra','Anjar','Mandvi','Kutch','Modasa','Visnagar',
    'Unjha','Sidhpur','Idar','Lunawada','Halol','Kalol','Sanand','Dholka',
  ],
  'Haryana': [
    'Faridabad','Gurgaon','Panipat','Ambala','Yamunanagar','Rohtak','Hisar',
    'Sonipat','Karnal','Panchkula','Bhiwani','Sirsa','Bahadurgarh','Jind',
    'Thanesar','Kaithal','Palwal','Rewari','Hansi','Narnaul','Fatehabad',
    'Mahendragarh','Jhajjar','Nuh','Charkhi Dadri','Mewat','Hodal','Shahabad',
    'Pinjore','Pataudi','Ballabhgarh','Manesar','Tosham','Ratia',
  ],
  'Himachal Pradesh': [
    'Shimla','Manali','Dharamshala','Solan','Mandi','Kullu','Palampur',
    'Baddi','Nahan','Sundarnagar','Hamirpur','Chamba','Una','Bilaspur',
    'Kangra','Nurpur','Rampur','Rohroo','Keylong','Kaza','Reckong Peo',
    'Dalhousie','Kasauli','Parwanoo','Nagrota Bagwan','Amb','Nadaun',
  ],
  'Jharkhand': [
    'Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Hazaribagh','Giridih',
    'Phusro','Ramgarh','Medininagar','Chaibasa','Dumka','Gumla','Lohardaga',
    'Simdega','Pakur','Jamtara','Sahebganj','Godda','Chatra','Khunti',
    'Latehar','Seraikela','East Singhbhum','West Singhbhum','Saraikela Kharsawan',
  ],
  'Karnataka': [
    'Bengaluru','Mysuru','Hubli','Dharwad','Mangaluru','Belagavi','Kalaburagi',
    'Davanagere','Ballari','Shivamogga','Tumakuru','Raichur','Bidar','Vijayapura',
    'Udupi','Hassan','Chikkamagaluru','Mandya','Gadag','Bagalkot','Koppal',
    'Chitradurga','Kolar','Yadgir','Haveri','Chamarajanagar','Kodagu','Ramanagara',
    'Chikkaballapura','Hosapete','Sindagi','Gokak','Ilkal','Yadgiri','Ranebennuru',
    'Bhadravathi','Tiptur','Arsikere','K R Nagar','Sagara','Sirsi','Karwar',
  ],
  'Kerala': [
    'Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Palakkad',
    'Alappuzha','Kannur','Kottayam','Malappuram','Kasaragod','Idukki','Pathanamthitta',
    'Wayanad','Ernakulam','Ponnani','Tirur','Vadakara','Thalassery','Ottapalam',
    'Perinthalmanna','Manjeri','Chavakkad','Irinjalakuda','Chalakudy','Guruvayur',
    'Thrippunithura','Kalamassery','Aluva','Perumbavoor','Muvattupuzha','Ettumanoor',
    'Changanacherry','Kanhangad','Payyanur','Nilambur','Tiruvalla','Kayamkulam',
  ],
  'Madhya Pradesh': [
    'Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna',
    'Ratlam','Rewa','Murwara','Singrauli','Burhanpur','Khandwa','Bhind',
    'Chhindwara','Guna','Shivpuri','Vidisha','Chhatarpur','Damoh','Mandsaur',
    'Khargone','Neemuch','Pithampur','Hoshangabad','Itarsi','Sehore','Betul','Seoni',
    'Balaghat','Tikamgarh','Morena','Datia','Dhar','Shahdol','Sidhi','Umaria',
    'Anuppur','Dindori','Mandla','Narsinghpur','Raisen','Rajgarh','Shajapur',
    'Agar Malwa','Alirajpur','Barwani','Burhanpur','Ashoknagar',
  ],
  'Maharashtra': [
    'Mumbai','Pune','Nagpur','Nashik','Aurangabad','Solapur','Amravati','Kolhapur',
    'Thane','Navi Mumbai','Kalyan','Dombivli','Vasai-Virar','Malegaon','Nanded',
    'Sangli','Jalgaon','Akola','Latur','Dhule','Ahmednagar','Chandrapur','Parbhani',
    'Ichalkaranji','Jalna','Ambarnath','Bhiwandi','Shirdi','Pandharpur','Satara',
    'Ratnagiri','Sindhudurg','Beed','Osmanabad','Hingoli','Wardha','Yavatmal',
    'Gondia','Bhandara','Gadchiroli','Washim','Buldhana','Alibag','Pen','Panvel',
    'Badlapur','Ulhasnagar','Mira-Bhayandar','Bhusawal','Amalner','Chopda',
    'Barshi','Khamgaon','Shegaon','Morshi','Achalpur','Pusad','Hinganghat',
  ],
  'Manipur': [
    'Imphal','Thoubal','Bishnupur','Churachandpur','Senapati','Ukhrul',
    'Chandel','Tamenglong','Jiribam','Moreh','Kakching','Noney','Kangpokpi',
    'Pherzawl','Tengnoupal',
  ],
  'Meghalaya': [
    'Shillong','Tura','Jowai','Nongstoin','Baghmara','Resubelpara','Mairang',
    'Nongpoh','Williamnagar','Khliehriat','Mawkyrwat','Ampati','Cherrapunji',
    'Mawsynram','Dawki','Phulbari',
  ],
  'Mizoram': [
    'Aizawl','Lunglei','Champhai','Serchhip','Kolasib','Lawngtlai','Mamit',
    'Saitual','Hnahthial','Khawzawl','Siaha','Tlabung','Zawlnuam',
  ],
  'Nagaland': [
    'Kohima','Dimapur','Mokokchung','Wokha','Zunheboto','Tuensang','Mon',
    'Phek','Longleng','Kiphire','Peren','Noklak','Shamator','Tseminyu',
  ],
  'Odisha': [
    'Bhubaneswar','Cuttack','Rourkela','Brahmapur','Sambalpur','Puri','Balasore',
    'Bhadrak','Baripada','Jharsuguda','Bargarh','Paradip','Angul','Dhenkanal',
    'Kendujhar','Bolangir','Phulbani','Rayagada','Koraput','Nabarangapur',
    'Malkangiri','Nuapada','Sonepur','Nayagarh','Jagatsinghpur','Kendrapara',
    'Jajpur','Ganjam','Gajapati','Kandhamal','Kalahandi','Sundargarh',
    'Mayurbhanj','Khordha','Puri','Cuttack','Balangir','Subarnapur',
  ],
  'Punjab': [
    'Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Hoshiarpur',
    'Batala','Pathankot','Moga','Abohar','Malerkotla','Khanna','Phagwara',
    'Muktsar','Barnala','Rajpura','Firozpur','Sangrur','Fatehgarh Sahib',
    'Ropar','Nawanshahr','Kapurthala','Gurdaspur','Tarn Taran','Faridkot',
    'Mansa','Fazilka','Sri Muktsar Sahib','Zirakpur','Derabassi','Dera Baba Nanak',
    'Dinanagar','Qadian','Nakodar','Phagwara','Adampur','Jagraon',
  ],
  'Rajasthan': [
    'Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bhilwara','Alwar',
    'Bharatpur','Sikar','Pali','Sri Ganganagar','Barmer','Tonk','Kishangarh',
    'Baran','Dhaulpur','Sawai Madhopur','Nagaur','Jhalawar','Jhunjhunu',
    'Churu','Hanumangarh','Banswara','Bundi','Rajsamand','Dausa','Pratapgarh',
    'Karauli','Jaisalmer','Dungarpur','Sirohi','Jalor','Balotra','Beawar',
    'Makrana','Sujangarh','Lachhmangarh','Pilani','Chittorgarh','Gangapur City',
    'Hindaun','Sawai Madhopur','Mount Abu',
  ],
  'Sikkim': [
    'Gangtok','Namchi','Mangan','Gyalshing','Jorethang','Rangpo','Singtam',
    'Geyzing','Ravangla','Yuksom','Pelling','Lachung','Lachen',
  ],
  'Tamil Nadu': [
    'Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli',
    'Tiruppur','Vellore','Erode','Thoothukudi','Dindigul','Thanjavur','Ranipet',
    'Sivakasi','Karur','Udhagamandalam','Hosur','Nagercoil','Kanchipuram',
    'Kumbakonam','Cuddalore','Pudukkottai','Rajapalayam','Ambattur','Avadi',
    'Tambaram','Tiruvannamalai','Nagapattinam','Villupuram','Virudhunagar',
    'Namakkal','Ariyalur','Perambalur','Krishnagiri','Dharmapuri','Theni',
    'Tiruvallur','Kanyakumari','Kallakurichi','Chengalpattu','Tenkasi',
    'Ranipet','Tirupattur','Mayiladuthurai','Tiruvarur','Nilgiris',
    'Valparai','Pollachi','Bhavani','Gobichettipalayam','Udumalaipettai',
  ],
  'Telangana': [
    'Hyderabad','Warangal','Nizamabad','Karimnagar','Ramagundam','Khammam',
    'Mahbubnagar','Nalgonda','Adilabad','Suryapet','Miryalaguda','Siddipet',
    'Mancherial','Jagtial','Bhongir','Vikarabad','Sangareddy','Medak',
    'Narayanpet','Nagarkurnool','Wanaparthy','Gadwal','Jogulamba','Jangaon',
    'Mulugu','Bhadradri Kothagudem','Kumuram Bheem','Nirmal','Rajanna Sircilla',
    'Mahabubabad','Peddapalli','Jayashankar','Yadadri Bhongir','Hanamkonda',
    'Secunderabad','Bodhan','Kamareddy','Zahirabad','Tandur',
  ],
  'Tripura': [
    'Agartala','Udaipur','Dharmanagar','Kailasahar','Belonia','Ambassa',
    'Khowai','Sabroom','Sonamura','Bishramganj','Melaghar','Amarpur',
    'Kamalpur','Kumarghat','Santirbazar',
  ],
  'Uttar Pradesh': [
    'Lucknow','Kanpur','Agra','Varanasi','Meerut','Allahabad','Bareilly',
    'Aligarh','Moradabad','Noida','Ghaziabad','Gorakhpur','Firozabad','Saharanpur',
    'Muzaffarnagar','Mathura','Faizabad','Rampur','Shahjahanpur','Jhansi',
    'Hapur','Ayodhya','Bulandshahr','Unnao','Rae Bareli','Lakhimpur','Bahraich',
    'Sitapur','Hardoi','Etawah','Mirzapur','Gonda','Ballia','Jaunpur',
    'Sultanpur','Fatehpur','Azamgarh','Bijnor','Mainpuri','Budaun',
    'Sambhal','Pilibhit','Amroha','Mau','Basti','Deoria','Kushinagar',
    'Maharajganj','Siddharth Nagar','Sant Kabir Nagar','Ambedkar Nagar',
    'Amethi','Barabanki','Kaushambi','Pratapgarh','Chandauli','Sant Ravidas Nagar',
    'Sonbhadra','Chitrakoot','Banda','Hamirpur','Mahoba','Lalitpur',
  ],
  'Uttarakhand': [
    'Dehradun','Haridwar','Roorkee','Haldwani','Rudrapur','Kashipur','Rishikesh',
    'Kotdwar','Ramnagar','Pithoragarh','Tehri','Uttarkashi','Chamoli',
    'Bageshwar','Almora','Champawat','Pauri','Srinagar (UK)','Lansdowne',
    'Mussoorie','Nainital','Ranikhet','Kichha','Jaspur','Sitarganj',
    'Tanakpur','Lohaghat','Didihat','Bageswar',
  ],
  'West Bengal': [
    'Kolkata','Asansol','Siliguri','Durgapur','Bardhaman','Malda','Baharampur',
    'Habra','Kharagpur','Shantipur','Dankuni','Dhulian','Ranaghat','Haldia',
    'Raiganj','Krishnanagar','Nabadwip','Medinipur','Jalpaiguri','Balurghat',
    'Basirhat','Bankura','Darjeeling','Purulia','Cooch Behar','Alipurduar',
    'Contai','Tamluk','Arambagh','Bishnupur','Serampore','Barrackpore',
    'Barasat','Bongaon','Kalyani','Howrah','Bally','Uluberia','Naihati',
    'Chandernagore','Rishra','Shyamnagar','Titagarh','Panihati','South Dum Dum',
    'Dum Dum','North Dum Dum','Kamarhati','Rajarhat','New Town','Salt Lake',
    'Bidhannagar','Belgharia','Champdani','Uttarpara','Konnagar','Bhadreswar',
    'Chinsurah','Hooghly','Berhampore','Domjur','Jamalpur','Katwa','Kalna',
  ],
  'Andaman and Nicobar Islands': [
    'Port Blair','Diglipur','Mayabunder','Rangat','Havelock Island',
    'Neil Island','Wandoor','Car Nicobar','Little Andaman','Bamboo Flat',
  ],
  'Chandigarh': ['Chandigarh','Mani Majra','Industrial Area','Sector 17','Sector 22'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman','Diu','Silvassa','Amli','Khanvel','Naroli'],
  'Delhi (NCT)': [
    'New Delhi','Dwarka','Rohini','Saket','Lajpat Nagar','Janakpuri','Pitampura',
    'Shahdara','Karol Bagh','Connaught Place','Vasant Kunj','Preet Vihar',
    'Mayur Vihar','Nehru Place','Rajouri Garden','Punjabi Bagh','Uttam Nagar',
    'Narela','Bawana','Mundka','Okhla','Mehrauli','Chattarpur','Najafgarh',
    'Vikaspuri','Paschim Vihar','Shalimar Bagh','Wazirpur','Ashok Vihar',
    'Model Town','Civil Lines','Krishna Nagar','Laxmi Nagar','Geeta Colony',
    'Patparganj','Dilshad Garden','Rohtas Nagar','Vivek Vihar','Mandawali',
  ],
  'Jammu and Kashmir': [
    'Srinagar','Jammu','Anantnag','Baramulla','Sopore','Kathua','Udhampur',
    'Punch','Rajouri','Doda','Ramban','Kulgam','Shopian','Ganderbal',
    'Bandipora','Kupwara','Kishtwar','Reasi','Samba','Budgam','Pulwama',
    'Awantipora','Tral','Pahalgam','Gulmarg','Sonamarg',
  ],
  'Ladakh': ['Leh','Kargil','Diskit','Padum','Zanskar','Nubra','Nyoma','Hanle','Tangtse'],
  'Lakshadweep': ['Kavaratti','Agatti','Amini','Andrott','Minicoy','Chetlat','Kadmat','Kiltan','Bitra'],
  'Puducherry': ['Puducherry','Karaikal','Mahe','Yanam','Ozhukarai','Ariyankuppam','Villianur'],
};

const TARIFF_DATA: Record<string, { day: string; high: number; low: number; pos: boolean }[]> = {
  Daily: [
    { day: 'Mon', high: 65, low: 25, pos: true },{ day: 'Tue', high: 70, low: 35, pos: false },
    { day: 'Wed', high: 80, low: 38, pos: true },{ day: 'Thu', high: 85, low: 50, pos: false },
    { day: 'Fri', high: 90, low: 55, pos: true },{ day: 'Sat', high: 88, low: 60, pos: false },
    { day: 'Sun', high: 95, low: 62, pos: true },
  ],
  Weekly: [
    { day: 'W1', high: 58, low: 20, pos: true },{ day: 'W2', high: 60, low: 30, pos: false },
    { day: 'W3', high: 72, low: 32, pos: true },{ day: 'W4', high: 85, low: 58, pos: true },
  ],
  Monthly: [
    { day: 'Jan', high: 55, low: 15, pos: true },{ day: 'Feb', high: 58, low: 30, pos: false },
    { day: 'Mar', high: 70, low: 35, pos: true },{ day: 'Apr', high: 72, low: 45, pos: false },
    { day: 'May', high: 85, low: 48, pos: true },{ day: 'Jun', high: 95, low: 70, pos: true },
  ],
};

// ─── Body-portal dropdown menu (web only) ───────────────────────────────────
// Renders directly into document.body via ReactDOM.createPortal so no parent
// overflow/transform/stacking-context can ever clip or hide it.
const BodyPortalMenu = ({ anchorEl, filtered, value, search, setSearch, onSelect, onClose }: {
  anchorEl: HTMLElement | null; filtered: string[]; value: string;
  search: string; setSearch: (v: string) => void;
  onSelect: (v: string) => void; onClose: () => void;
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!anchorEl) return;
    // Measure trigger and keep updating on scroll/resize
    const measure = () => setRect(anchorEl.getBoundingClientRect());
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);

    // Close on outside click
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!anchorEl.contains(t) && !(document.getElementById('dd-portal-menu')?.contains(t))) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onDown);

    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      document.removeEventListener('mousedown', onDown);
    };
  }, [anchorEl]);

  if (!rect || !ReactDOM) return null;

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: rect.bottom,
    left: rect.left,
    width: Math.max(rect.width, 230),
    zIndex: 2147483647,
    backgroundColor: '#ffffff',
    border: '1.5px solid #2563EB',
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
    boxShadow: '0 16px 36px rgba(0,0,0,0.20)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 300,
    fontFamily: 'system-ui, sans-serif',
  };

  return ReactDOM.createPortal(
    <div id="dd-portal-menu" style={menuStyle}>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search..."
        autoFocus
        style={{
          margin: '8px 10px 6px', padding: '7px 10px', fontSize: 13,
          borderRadius: 8, border: '1px solid #E5E7EB',
          outline: 'none', color: '#1F2937', flexShrink: 0,
          fontFamily: 'inherit',
        }}
      />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {filtered.length === 0
          ? <div style={{ padding: '10px 14px', fontSize: 13, color: '#94A3B8' }}>No results</div>
          : filtered.map(s => (
            <div
              key={s}
              onMouseDown={e => { e.preventDefault(); onSelect(s); }}
              style={{
                padding: '10px 14px', fontSize: 13, cursor: 'pointer',
                color: s === value ? '#2563EB' : '#1F2937',
                fontWeight: s === value ? 600 : 400,
                fontFamily: 'inherit',
                userSelect: 'none' as const,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{s}</div>
          ))
        }
      </div>
    </div>,
    document.body
  );
};

// ─── Universal Dropdown ───────────────────────────────────────────────────────
const AppDropdown = ({ value, items, onSelect, placeholder = 'Select...' }: {
  value: string; items: string[]; onSelect: (v: string) => void; placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  // divRef points to a real native <div> on web — gives a true HTMLElement
  // so getBoundingClientRect() works correctly inside BodyPortalMenu.
  const divRef = useRef<HTMLDivElement>(null);
  const filtered = items.filter(s => s.toLowerCase().includes(search.toLowerCase()));
  const close = useCallback(() => { setOpen(false); setSearch(''); }, []);

  if (Platform.OS === 'web') {
    return (
      // The outer div is the anchor — its ref is passed to the portal for measurement
      <div ref={divRef} style={{ position: 'relative', width: '100%' }}>
        {/* Trigger rendered as a plain div button so we keep full styling control */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(o => !o)}
          onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
          style={{
            display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10,
            padding: '10px 12px', border: '1px solid #E5E7EB', cursor: 'pointer',
            userSelect: 'none', outline: 'none', fontFamily: 'inherit',
          }}
        >
          <span style={{
            fontFamily: 'Poppins_500Medium, sans-serif', fontSize: 13,
            color: value ? '#1F2937' : '#94A3B8', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginRight: 6,
          }}>
            {value || placeholder}
          </span>
          <span style={{ fontSize: 12, color: '#4B5563', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
        </div>

        {open && (
          <BodyPortalMenu
            anchorEl={divRef.current}
            filtered={filtered}
            value={value}
            search={search}
            setSearch={setSearch}
            onSelect={v => { onSelect(v); close(); }}
            onClose={close}
          />
        )}
      </div>
    );
  }

  // ── Native fallback ──
  return (
    <View style={{ position: 'relative', zIndex: 1000 }}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} style={styles.dropdownTrigger}>
        <Text style={[styles.dropdownValue, !value && { color: COLORS.textMuted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.textBody} />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownMenu}>
          <TextInput style={styles.dropdownSearch} placeholder="Search..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled showsVerticalScrollIndicator>
            {filtered.map(s => (
              <TouchableOpacity key={s} style={styles.dropdownOption} onPress={() => { onSelect(s); close(); }}>
                <Text style={[styles.optionText, s === value && { color: COLORS.primaryBlue, fontFamily: 'Poppins_600SemiBold' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ─── Full-height Bar Chart ───
const CandleChart = ({ data }: { data: typeof TARIFF_DATA['Daily'] }) => {
  const max = Math.max(...data.map(d => d.high));
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 6, paddingBottom: 24, paddingTop: 8 }}>
      {data.map((item, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', marginHorizontal: 3 }}>
          <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
            <View style={{ height: `${Math.round((item.high / max) * 100)}%` as any, backgroundColor: item.pos ? COLORS.posBlue : COLORS.negPink, borderRadius: 5, minHeight: 10, opacity: 0.9 }} />
          </View>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 5, textAlign: 'center' }}>{item.day}</Text>
        </View>
      ))}
    </View>
  );
};

const FeatureItem = ({ label }: { label: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.checkCircle}><Ionicons name="checkmark" size={15} color={COLORS.primaryBlue} /></View>
    <Text style={styles.featureLabel}>{label}</Text>
  </View>
);

// ─── Main Screen ───
export default function SpotlightScreenWeb() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  const [activeItem, setActiveItem] = useState('Spotlights');
  const [toggleType, setToggleType] = useState('Skill');
  const [selectedState, setSelectedState] = useState('West Bengal');
  const [selectedCity, setSelectedCity] = useState('Kolkata');
  const [chartTimeFilter, setChartTimeFilter] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const router = useRouter();

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isCompact = isMobile || isTablet;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreenWidth(window.width));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const d = await getAuthData();
        if (d?.token) { setUserEmail(d.email || ''); setTeacherName(d.name || 'Teacher'); setProfileImage(d.profileImage || null); }
      } catch {}
    })();
  }, []);

  const handleBackPress = useCallback(() => router.push('/(tabs)/TeacherDashBoard/Teacher'), [router]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') handleBackPress(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [handleBackPress]);

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSelectedCity(CITIES_BY_STATE[state]?.[0] || '');
  };

  const handleContinue = () => router.push({
    pathname: '/(tabs)/TeacherDashBoard/Payment',
    params: { selectedState, selectedCity, selectedHotspot: toggleType, selectedPlan: 'Spotlight Plan', paymentAmount: 149, gst: (149 * 0.18).toFixed(0), total: (149 + 149 * 0.18).toFixed(0) },
  });

  if (!fontsLoaded) return <View style={styles.loaderContainer}><ActivityIndicator size="large" color={COLORS.primaryBlue} /></View>;

  return (
    <View style={styles.container}>
      <TeacherWebHeader teacherName={teacherName} profileImage={profileImage} showSearch />
      <View style={styles.contentLayout}>
        <TeacherWebSidebar activeItem={activeItem} onItemPress={setActiveItem} userEmail={userEmail} teacherName={teacherName} profileImage={profileImage} />
        <ScrollView style={styles.mainScroll} contentContainerStyle={[styles.scrollContent, isMobile && { padding: 14 }]} showsVerticalScrollIndicator={false}>

          <View style={styles.pageHeader}>
            <TouchableOpacity style={styles.backBtnCircle} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textHeader} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, isMobile && { fontSize: 20 }]}>Boost your visibility with Spotlight</Text>
          </View>

          <View style={[styles.topControls, isCompact && { flexDirection: 'column', gap: 12 }]}>
            <View style={[styles.filterGroup, isCompact && { flexDirection: 'column', gap: 10, marginRight: 0, width: '100%' }]}>
              <View style={[styles.filterCard, isCompact && { flex: undefined, width: '100%' }]}>
                <View style={styles.filterIconRow}>
                  <Ionicons name="map-outline" size={14} color={COLORS.primaryBlue} />
                  <Text style={styles.filterLabel}>STATE</Text>
                </View>
                <AppDropdown value={selectedState} items={STATES} onSelect={handleStateSelect} />
              </View>
              <View style={[styles.filterCard, isCompact && { flex: undefined, width: '100%' }]}>
                <View style={styles.filterIconRow}>
                  <Ionicons name="location-sharp" size={14} color={COLORS.primaryBlue} />
                  <Text style={styles.filterLabel}>CITY</Text>
                </View>
                <AppDropdown value={selectedCity} items={CITIES_BY_STATE[selectedState] || []} onSelect={setSelectedCity} placeholder="Select city..." />
              </View>
            </View>
            <View style={[styles.toggleContainer, isCompact && { width: '100%' }]}>
              {['Subject', 'Skill'].map(t => (
                <TouchableOpacity key={t} style={[styles.toggleBtn, toggleType === t && styles.toggleBtnActive]} onPress={() => setToggleType(t)}>
                  <Text style={[styles.toggleText, toggleType === t && styles.toggleTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.mainSection, isCompact && { flexDirection: 'column' }]}>
            {/* Chart Card */}
            <View style={[styles.tariffChartCard, isCompact && { marginBottom: 20, minHeight: 380 }]}>
              <View style={styles.tariffCardHeader}>
                <View>
                  <Text style={styles.tariffCardTitle}>Spotlight Tariffs</Text>
                  <Text style={styles.tariffCardSubtitle}>Price trends over time</Text>
                </View>
                <View style={styles.tariffFilterRow}>
                  {(['Daily', 'Weekly', 'Monthly'] as const).map(f => (
                    <TouchableOpacity key={f} style={[styles.tariffFilterBtn, chartTimeFilter === f && styles.tariffFilterBtnActive]} onPress={() => setChartTimeFilter(f)}>
                      <Text style={[styles.tariffFilterText, chartTimeFilter === f && styles.tariffFilterTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.tariffLiveStrip}>
                <View style={styles.tariffLiveDot} />
                <Text style={styles.tariffLiveText}>LIVE</Text>
                <Text style={styles.tariffStripVal}>₹149</Text>
                <View style={styles.tariffStripBadge}>
                  <Ionicons name="trending-up" size={11} color="#10B981" />
                  <Text style={styles.tariffStripBadgeText}>+8.4%</Text>
                </View>
                <Text style={styles.tariffStripSep}>|</Text>
                <Text style={styles.tariffStripMeta}>{chartTimeFilter === 'Daily' ? '7 days' : chartTimeFilter === 'Weekly' ? '4 weeks' : '6 months'}</Text>
              </View>

              <View style={styles.chartFill}>
                <CandleChart data={TARIFF_DATA[chartTimeFilter]} />
              </View>

              <View style={styles.tariffLegend}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.posBlue }]} /><Text style={styles.legendText}>Positive</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.negPink }]} /><Text style={styles.legendText}>Negative</Text></View>
                <Text style={styles.legendRight}>{chartTimeFilter === 'Daily' ? 'Mon–Sun' : chartTimeFilter === 'Weekly' ? 'W1–W4' : 'Jan–Jun'}</Text>
              </View>
            </View>

            {/* Pricing Card */}
            <View style={[styles.pricingCard, isCompact && { width: '100%', maxWidth: '100%' as any }]}>
              <View style={styles.pricingHeader}>
                <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>✦ RECOMMENDED</Text></View>
                <Text style={[styles.planTitle, isMobile && { fontSize: 26 }]}>Spotlights</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceSymbol}>₹</Text>
                  <Text style={styles.priceValue}>149</Text>
                  <Text style={styles.priceUnit}>/month</Text>
                </View>
                <Text style={styles.pricingNote}>Billed monthly · Cancel anytime</Text>
              </View>
              <View style={styles.featuresList}>
                <FeatureItem label="Full Regional Visibility" />
                <FeatureItem label="Predictive Pricing Alerts" />
                <FeatureItem label="Unlimited Density Access" />
                <FeatureItem label="24/7 Priority Support" />
              </View>
              <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.85} onPress={handleContinue}>
                <Text style={styles.upgradeBtnText}>Upgrade Now →</Text>
              </TouchableOpacity>
              <Text style={styles.pricingFooter}>No hidden charges · Instant activation</Text>
            </View>
          </View>

          <View style={styles.bottomAd}>
            <Text style={styles.adSectionTitle}>ADVERTISING</Text>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1540200049848-d9813ea0e120?q=80&w=2070' }} style={styles.adBannerImg} resizeMode="cover" />
            <View style={styles.adContent}>
              <Text style={styles.adTitle}>Summer sale is on!</Text>
              <Text style={styles.adSubtitle}>Buy your loved pieces with reduced prices up to 70% off!</Text>
            </View>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

const sh = (web: string, nat: object) => Platform.select({ web: web as any, default: nat });

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentLayout: { flex: 1, flexDirection: 'row' },
  mainScroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },

  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: COLORS.textHeader, flex: 1, letterSpacing: -0.5 },
  backBtnCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...sh('0 2px 8px rgba(0,0,0,0.08)', { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }) },

  topControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 16 },
  filterGroup: { flex: 1, flexDirection: 'row', gap: 14, marginRight: 16 },
  filterCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 16, minWidth: 180, ...sh('0 4px 14px rgba(0,0,0,0.05)', { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 4 }) },
  filterIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  filterLabel: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: COLORS.textMuted, letterSpacing: 1 },

  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  dropdownValue: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: COLORS.textHeader, flex: 1, marginRight: 6 },
  dropdownMenu: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primaryBlue, borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, zIndex: 9999, ...sh('0 10px 25px rgba(0,0,0,0.15)', { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 }) },
  dropdownSearch: { margin: 8, padding: 8, paddingHorizontal: 12, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textBody },
  dropdownOption: { paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  optionText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textBody },

  toggleContainer: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 4, ...sh('0 4px 10px rgba(0,0,0,0.06)', { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }), minWidth: 180, alignSelf: 'flex-start' },
  toggleBtn: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 9, flex: 1, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: COLORS.primaryBlue },
  toggleText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.textMuted },
  toggleTextActive: { color: COLORS.white },

  mainSection: { flexDirection: 'row', gap: 24, marginBottom: 32, alignItems: 'stretch' },
  tariffChartCard: { flex: 1, backgroundColor: '#0F172A', borderRadius: 18, padding: 22, minHeight: 440, flexDirection: 'column', ...sh('0 16px 36px rgba(15,23,42,0.3)', { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.3, shadowRadius: 36, elevation: 18 }) },
  tariffCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  tariffCardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#F8FAFC', letterSpacing: -0.3 },
  tariffCardSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  tariffFilterRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 9, padding: 3, gap: 2 },
  tariffFilterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7 },
  tariffFilterBtnActive: { backgroundColor: COLORS.primaryBlue },
  tariffFilterText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  tariffFilterTextActive: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  tariffLiveStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 12, gap: 7 },
  tariffLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  tariffLiveText: { fontFamily: 'Poppins_700Bold', fontSize: 9, color: '#10B981', letterSpacing: 1 },
  tariffStripVal: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#F8FAFC', marginLeft: 2 },
  tariffStripBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, gap: 2 },
  tariffStripBadgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#10B981' },
  tariffStripSep: { color: 'rgba(255,255,255,0.2)', fontSize: 13 },
  tariffStripMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  chartFill: { flex: 1, minHeight: 200 },
  tariffLegend: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  legendRight: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' as any },

  pricingCard: { width: 320, maxWidth: 340, backgroundColor: '#2563EB', borderRadius: 18, padding: 28, flexDirection: 'column', justifyContent: 'space-between', ...sh('0 18px 30px rgba(37,99,235,0.22)', { shadowColor: COLORS.primaryBlue, shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.22, shadowRadius: 30, elevation: 15 }) },
  pricingHeader: { marginBottom: 28 },
  recommendedBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
  recommendedText: { fontFamily: 'Poppins_700Bold', fontSize: 9, color: COLORS.white, letterSpacing: 0.5 },
  planTitle: { fontFamily: 'Poppins_700Bold', fontSize: 30, color: COLORS.white, marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  priceSymbol: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, color: COLORS.white, marginBottom: 5, marginRight: 2 },
  priceValue: { fontFamily: 'Poppins_700Bold', fontSize: 40, color: COLORS.white },
  priceUnit: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 8 },
  pricingNote: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  featuresList: { marginBottom: 32, gap: 14 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  featureLabel: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.white, flex: 1 },
  upgradeBtn: { backgroundColor: COLORS.white, borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center' },
  upgradeBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.primaryBlue },
  pricingFooter: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 12 },

  bottomAd: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, ...sh('0 4px 10px rgba(0,0,0,0.05)', { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }) },
  adSectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: COLORS.textMuted, marginBottom: 14, letterSpacing: 1 },
  adBannerImg: { width: '100%', height: 140, borderRadius: 12, marginBottom: 16 },
  adContent: { paddingHorizontal: 4 },
  adTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.textHeader },
  adSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textBody, marginTop: 4 },
});