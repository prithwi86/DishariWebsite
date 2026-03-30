import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AnimateOnScroll from '../components/AnimateOnScroll'
import logo from '../assets/Dishari_logo_tranparent_final.png'
import { stripCommentedFields } from '../utils/jsonHelper'

const VALUE_ICONS = {
  Inclusion: 'fas fa-hands-holding-circle',
  Coexistence: 'fas fa-link',
  Resilience: 'fas fa-shield-heart',
  Creativity: 'fas fa-lightbulb',
}

function About() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/data/about-us.json')
      .then((r) => r.json())
      .then((raw) => stripCommentedFields(raw))
      .then((json) => setData(json.organization))
      .catch(() => {})
  }, [])

  if (!data) return null

  const whoWeAre = data['Who We Are']
  const vision = data['Our Vision']
  const mission = data['Our Mission']
  const coreValues = data['Our Core Values'] || []
  const impact = data['Our Impact'] || []
  const committees = whoWeAre?.commities || []

  return (
    <>
      {/* Page Header */}
      <section className="about-page-header">
        <div className="container">
          <div className="about-header-title">
            <h1>About {data.name}</h1>
            <p>{data.About}</p>
          </div>
          <div className="about-header-grid">
            <div className="about-header-image">
              <img
                src={data.Img_Url || logo}
                alt={data.name}
                onError={(e) => { e.target.onerror = null; e.target.src = logo }}
              />
            </div>
            <div className="about-header-text">
              <h2>Who We Are</h2>
              {whoWeAre?.text?.map((para, i) => (
                <p key={i} className="about-text">{para}</p>
              ))}
            </div>
          </div>

          {/* Members */}
          {committees.map((committee) => (
            <div key={committee.name} className="committee-block">
              <h3 className="committee-title">{committee.name}</h3>
              <div className="members-grid">
                {committee.members.map((member) => (
                  <a
                    key={member.email}
                    href={`mailto:${member.email}`}
                    className="member-card"
                  >
                    <div className="member-hex">
                      <img
                        src={member.pic_url || logo}
                        alt={member.name}
                        className="member-pic"
                      />
                    </div>
                    <span className="member-name">{member.name}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vision Statement */}
      <section className="statement-section vision-bg">
        <div className="container">
          <div className="statement-content">
            <i className="fas fa-eye"></i>
            <h2>Our Vision</h2>
            {vision?.text?.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="statement-section mission-bg">
        <div className="container">
          <div className="statement-content">
            <i className="fas fa-heart"></i>
            <h2>Our Mission</h2>
            <p>{mission?.text?.join(' ')}</p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="core-values">
        <div className="container">
          <h2>Our Core Values</h2>
          <div className="values-detail-grid">
            {coreValues.map((value) => (
              <AnimateOnScroll key={value.name} className="value-detail">
                <div className="value-icon">
                  <i className={VALUE_ICONS[value.name] || 'fas fa-star'}></i>
                </div>
                <h3>{value.name}</h3>
                <p>{value.text?.join(' ')}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact">
        <div className="container">
          <h2>Our Impact</h2>
          <div className="impact-grid">
            {impact.map((item) => (
              <AnimateOnScroll key={item.name} className="impact-card">
                <h3>{item.name}</h3>
                <p>{item.text?.join(' ')}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default About
