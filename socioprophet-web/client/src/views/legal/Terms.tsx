import React from 'react';
import { Link } from 'react-router-dom';

// styles
import './scss/terms.scss';

const Terms = (): JSX.Element => {
  return (
    <div className="terms">
      <h1 className="terms__main">SocioProphet, Inc. Terms of Use</h1>
      <h3 className="terms__heading">ACCEPTANCE OF TERMS</h3>
      <p className="terms__description">
        This site is owned and operated by SocioProphet.com ("SocioProphet.com"). By accessing the
        website you are agreeing to be bound by these terms of service in a legal agreement between
        you ("YOU", "YOUR") and SocioProphet.com ("SOCIOPROPHET", "WE", "OUR"). YOU are responsible
        for compliance with any and all applicable international, national, state and/or local laws
        and regulations. If YOU do not agree with any of these terms, YOU are prohibited from using
        or accessing this site. The software, materials and intellectual property rights contained
        in the SOCIOPROPHET website are owned and controlled by SOCIOPROPHET and are protected and
        reserved by applicable copyright and trademark law. SOCIOPROPHET may revise these Terms and
        Conditions of Use from time to time.
      </p>
      <h3 className="terms__heading">DISCLAIMER</h3>
      <p className="terms__description">
        The services and materials on the SOCIOPROPHET website are provided on an 'as is' basis.
        SOCIOPROPHET makes no warranties, expressed or implied, and hereby disclaims and negates all
        other warranties including, without limitation, implied warranties or conditions of
        merchantability, fitness for a particular purpose, or non-infringement of intellectual
        property or other violation of rights. Further, SOCIOPROPHET does not warrant or make any
        representations concerning the accuracy, likely results, or reliability of the use of the
        services and/or materials on its website or otherwise relating to such services and/or
        materials or on any sites linked to this site. SOCIOPROPHET reserves the right to
        discontinue or alter any or all of the SOCIOPROPHET website services, and to stop publishing
        the SOCIOPROPHET website, at any time in OUR sole discretion without notice or explanation;
        and save to the extent expressly provided otherwise in these Terms and Conditions, YOU will
        not be entitled to any compensation or other payment upon the discontinuance or alteration
        of any website services, or if WE stop publishing the SOCIOPROPHET website. SOCIOPROPHET
        reserves the right to terminate or suspend YOUR access to and use of the SOCIOPROPHET
        website, or parts of the SOCIOPROPHET website, without notice, if WE believe, in OUR sole
        discretion, that such use (i) is in violation of any applicable law; (ii) is harmful to OUR
        interests or the interests, including intellectual property or other rights, of another
        person or entity; or (iii) where SOCIOPROPHET or its agents have reason to believe that YOU
        are in violation of these Terms and Conditions of Use. SOCIOPROPHET reserves the right to
        block computers and/or devices using YOUR IP address from accessing the SOCIOPROPHET
        website. SOCIOPROPHET reserves the right to contact any or all of YOUR internet service
        providers and request that they block YOUR access to the SOCIOPROPHET website. SOCIOPROPHET
        reserves the right to commence legal action against YOU, whether for breach of contract or
        otherwise. The SOCIOPROPHET logos and other SOCIOPROPHET registered and unregistered
        trademarks are trademarks belonging to SOCIOPROPHET; WE give no permission for the use of
        these trademarks, and such use may constitute an infringement of OUR rights. The third party
        registered and unregistered trademarks, service marks and/or content on the SOCIOPROPHET
        website are the property of their respective owners and, unless stated otherwise in these
        terms and conditions, WE do not endorse and are not affiliated with any of the holders of
        any such rights and as such WE cannot grant any license to exercise such rights.
      </p>
      <h3 className="terms__heading">LIABILITY LIMITATIONS </h3>
      <p className="terms__description">
        {' '}
        In no event shall SOCIOPROPHET or its suppliers be liable for any damages (including,
        without limitation, damages for loss of data or profit, or due to business interruption)
        arising out of the use or inability to use services and/or materials on the SOCIOPROPHET
        website, even if SOCIOPROPHET or a SOCIOPROPHET authorized representative has been notified
        orally or in writing of the possibility of such damage, SOCIOPROPHET does not warrant or
        guarantee the completeness or accuracy of the information published on the SOCIOPROPHET
        website. SOCIOPROPHET does not warrant or guarantee that the SOCIOPROPHET website or its
        content or material is or will remain up to date, accurate or factual. SOCIOPROPHET does not
        warrant or guarantee that the website or its content, material or any service on the website
        will remain available or accessible.
      </p>
      <h3 className="terms__heading">INDEMNIFICATION </h3>
      <p className="terms__description">
        YOU agree to defend, indemnify and hold harmless SOCIOPROPHET and its affiliates, agents,
        vendors and/or suppliers from and against any and all claims, damages, costs and expenses,
        including reasonable attorneys' fees, arising from or related to YOUR use or misuse of the
        SOCIOPROPHET website, including, without limitation, YOUR violation of these Terms and
        Conditions, the infringement by YOU, or any other subscriber or user of YOUR account, of any
        intellectual property right or other right of any person or entity. WE have no control over
        third party websites and their contents, and WE accept no responsibility for them or for any
        loss or damage that may arise from YOUR use of them.
      </p>
      <h3 className="terms__heading">PERMITTED USES </h3>
      <p className="terms__description">
        YOU may use the SOCIOPROPHET website, its services and materials for the sole purpose of
        searching, reading and sharing with other users. YOU may not use the SOCIOPROPHET website to
        violate any applicable international, national, state and/or local laws and regulations,
        including without limitation any applicable laws relating to antitrust or other illegal
        trade or business practices, federal and state securities laws, regulations promulgated by
        the U.S. Securities and Exchange Commission, any rules of any national or other securities
        exchange, and any U.S. laws, rules, and regulations governing the export and re-export of
        commodities or technical data.
      </p>
      <h3 className="terms__heading">NON-PERMITTED USES </h3>
      <p className="terms__description">
        YOU may not upload or transmit any material that infringes or misappropriates any person's
        copyright, patent, trademark, or trade secret, or disclose via the SOCIOPROPHET website any
        information the disclosure of which would constitute a violation of any confidentiality
        obligations YOU may have. YOU may not upload any viruses, worms, Trojan horses, or other
        forms of harmful computer code, nor subject the SOCIOPROPHET website's network or servers to
        unreasonable traffic loads, or otherwise engage in conduct deemed disruptive to the ordinary
        operation of the SOCIOPROPHET website. YOU are strictly prohibited from communicating on or
        through the SOCIOPROPHET website any unlawful, harmful, offensive, threatening, abusive,
        libelous, harassing, defamatory, vulgar, obscene, profane, hateful, fraudulent, sexually
        explicit, racially, ethnically, or otherwise objectionable material of any sort, including,
        but not limited to, any material that encourages conduct that would constitute a criminal
        offense, give rise to civil liability, or otherwise violate any applicable local, state,
        national, or international law. YOU may not use the SOCIOPROPHET website in any way or take
        any action that causes, or may cause, damage to the website or impairment of the
        performance, availability or accessibility of the website. YOU may not use the SOCIOPROPHET
        website in any way that is unlawful, illegal, fraudulent or harmful, or in connection with
        any unlawful, illegal, fraudulent or harmful purpose or activity. YOU may not use the
        SOCIOPROPHET website to copy, store, host, transmit, send, use, publish or distribute any
        material which consists of (or is linked to) any spyware, computer virus, Trojan horse,
        worm, keystroke logger, rootkit or other malicious computer software. YOU may not conduct
        any systematic or automated data collection activities (including without limitation
        scraping, data mining, data extraction and data harvesting) on or in relation to the
        SOCIOPROPHET website without OUR express written consent. YOU may not access or otherwise
        interact with the SOCIOPROPHET website using any robot, spider or other automated means,
        except for the purpose of search engine indexing. YOU may not violate the directives set out
        in the robots.txt file for the SOCIOPROPHET website. YOU may not use data collected from the
        SOCIOPROPHET website for any direct marketing activity (including without limitation email
        marketing, SMS marketing, telemarketing and direct mailing).
      </p>
      <h3 className="terms__heading">USER RIGHTS </h3>
      <p className="terms__description">
        {' '}
        YOU may register for an account with the SOCIOPROPHET website by completing and submitting
        YOUR email address on the login page form on the SOCIOPROPHET website, and clicking on the
        login verification link in the email that the website will send to YOU. YOU may delete YOUR
        account on the SOCIOPROPHET website using YOUR account on the Delete Your Account page form
        the SOCIOPROPHET website.
      </p>
      <h3 className="terms__heading">USE OF PERSONALLY IDENTIFIABLE INFORMATION </h3>
      <p className="terms__description">
        Information submitted to the SOCIOPROPHET website is governed according to the SOCIOPROPHET
        current Privacy Policy and the stated license of this website. Although sections of the
        SOCIOPROPHET website may be viewed simply by visiting the SOCIOPROPHET website, in order to
        access some content and/or additional features offered at the SOCIOPROPHET website, YOU may
        need to create an account. If YOU create an account on the SOCIOPROPHET website, YOU may be
        asked to supply YOUR email address. YOU are responsible for maintaining the confidentiality
        of YOUR account and email address and are fully responsible for all activities that occur in
        connection with YOUR account. YOU agree to immediately notify us of any unauthorized use of
        either YOUR account or any other breach of security. YOU further agree that YOU will not
        permit others, including those whose accounts have been terminated, to access the
        SOCIOPROPHET website using YOUR account. YOU grant SOCIOPROPHET and all other persons or
        entities involved in the operation of the SOCIOPROPHET website the right to transmit,
        monitor, retrieve, store, and use YOUR information in connection with the operation of the
        SOCIOPROPHET website and in the provision of services to YOU. SOCIOPROPHET cannot and does
        not assume any responsibility or liability for any information YOU submit, or YOUR or third
        parties' use or misuse of information transmitted or received using website.
      </p>
      <h3 className="terms__heading"> PAYMENT AUTHORIZATION </h3>
      <p className="terms__description">
        When purchasing services and/or products from SocioProphet.com YOU hereby authorize and
        permit SocioProphet to send instructions to the financial institution that issued YOUR card
        or payment source to take payments from YOUR card or payment source account in accordance
        with the terms of YOUR agreement with SocioProphet.
      </p>
      <h3 className="terms__heading"> SUBSCRIPTIONS AND UPGRADE KEYS </h3>
      <p className="terms__description">
        If YOU have an active subscription or upgrade key and delete YOUR account, YOU will not be
        entitled to any refund.
      </p>
      <h3 className="terms__heading"> MODERATION </h3>
      <p className="terms__description">
        Without advance notice and at any time, SOCIOPROPHET may, for violations of this agreement
        or for any other reason WE choose, suspend YOUR access to SOCIOPROPHET and/or suspend or
        terminate YOUR account.
      </p>
      <h3 className="terms__heading"> TERMINATION </h3>
      <p className="terms__description">
        These Terms and Conditions of Use are effective until terminated by either party. If YOU no
        longer agree to be bound by these Terms and Conditions, YOU must cease use of the
        SOCIOPROPHET website. If YOU are dissatisfied with the SOCIOPROPHET website and/or its
        services and content, or any of these terms, conditions, and policies, YOUR sole legal
        remedy is to discontinue using the SOCIOPROPHET website.
      </p>
      <h3 className="terms__heading">WARRANTY DISCLAIMER </h3>
      <p className="terms__description">
        The SocioProphet.com website and associated materials are provided on an "as is" and "as
        available" basis. To the full extent permissible by applicable law, SocioProphet.com
        disclaims all warranties, express or implied, including, but not limited to, implied
        warranties of merchantability and fitness for a particular purpose, or non-infringement of
        intellectual property. SocioProphet.com makes no representations or warranty that the
        SocioProphet.com website will meet YOUR requirements, or that YOUR use of the
        SocioProphet.com website will be uninterrupted, timely, secure, or error free; nor does
        SocioProphet.com makes any representation or warranty as to the results that may be obtained
        from the use of the SocioProphet.com website. SocioProphet.com makes no representations or
        warranties of any kind, express or implied, as to the operation of the SocioProphet.com
        website or the information, content, materials, or products included on the SocioProphet.com
        website In no event shall SocioProphet.com or any of its agents, vendors or suppliers be
        liable for any damages whatsoever (including, without limitation, damages for loss of
        profits, business interruption, loss of information) arising out of the use, misuse of or
        inability to use the SocioProphet.com website, even if SocioProphet.com has been advised of
        the possibility of such damages. This disclaimer constitutes an essential part of this
        agreement. Because some jurisdictions prohibit the exclusion or limitation of liability for
        consequential or incidental damages, the above limitation may not apply to YOU. YOU
        understand and agree that any content downloaded or otherwise obtained through the use of
        the SocioProphet.com website is at YOUR own discretion and risk and that YOU will be solely
        responsible for any damage to YOUR computer system or loss of data or business interruption
        that results from the download of content. SocioProphet.com shall not be responsible for any
        loss or damage caused, or alleged to have been caused, directly or indirectly, by the
        information or ideas contained, suggested or referenced in or appearing on the
        SocioProphet.com website. YOUR participation in the SocioProphet.com website is solely at
        YOUR own risk. No advice or information, whether oral or written, obtained by YOU from
        SocioProphet.com or through its agents, their employees, or third parties shall create any
        warranty not expressly made herein. YOU acknowledge, by YOUR use of the SocioProphet.com
        website, that YOUR use of the SocioProphet.com website is at YOUR sole risk. Under no
        circumstances and under no legal or equitable theory, whether in tort, contract, negligence,
        strict liability or otherwise, shall SocioProphet.com or any of its agents, vendors or
        suppliers be liable to YOU (the user) or to any other person for any indirect, special,
        incidental or consequential losses or damages of any nature arising out of or in connection
        with the use of or inability to use the SocioProphet.com website or for any breach of
        security associated with the transmission of sensitive information through the
        SocioProphet.com website or for any information obtained through the SocioProphet.com
        website, including, without limitation, damages for lost profits, loss of goodwill, loss or
        corruption of data, work stoppage, accuracy of results, or computer failure or malfunction,
        even if an authorized representative of SocioProphet.com has been advised of or should have
        known of the possibility of such damages. SocioProphet.com 's total cumulative liability for
        any and all claims in connection with the SocioProphet.com website will not exceed five U.S.
        dollars ($5.00). YOU (the user) agree and acknowledge that the foregoing limitations on
        liability are an essential basis of the bargain and that SocioProphet.com would not provide
        the SocioProphet.com website absent such limitation.
      </p>
      <h3 className="terms__heading">GENERAL </h3>
      <p className="terms__description">
        The SOCIOPROPHET website is hosted in the United States. SOCIOPROPHET makes no claims that
        the Content on the SOCIOPROPHET website is appropriate or may be downloaded outside of the
        United States. Access to the Content may not be legal by certain persons or in certain
        countries. If YOU access the SOCIOPROPHET website from outside the United States, YOU do so
        at YOUR own risk and are responsible for compliance with the laws of YOUR jurisdiction. The
        provisions of the UN Convention on Contracts for the International Sale of Goods will not
        apply to these Terms. A party may give notice to the other party only in writing at that
        party's principal place of business, attention of that party's principal legal officer, or
        at such other address or by such other method as the party shall specify in writing. Notice
        shall be deemed given upon personal delivery, or, if sent by certified mail with USPS
        prepaid, 10 business days after the date of mailing, or, if sent by international overnight
        courier with USPS prepaid, 10 business days after the date of mailing. If any provision
        herein is held to be unenforceable, the remaining provisions will continue in full force
        without being affected in any way. Further, the parties agree to replace such unenforceable
        provision with an enforceable provision that most closely approximates the intent and
        economic effect of the unenforceable provision. Section headings are for reference purposes
        only and do not define, limit, construe or describe the scope or extent of such section. The
        failure of SOCIOPROPHET to act with respect to a breach of this Agreement by YOU or others
        does not constitute a waiver and shall not limit SOCIOPROPHET's rights with respect to such
        breach or any subsequent breaches. Any action or proceeding arising out of or related to
        this Agreement or YOUR (User's) use of the SOCIOPROPHET website must be brought in the
        courts of Belgium, and YOU consent to the exclusive personal jurisdiction and venue of such
        courts. Any cause of action YOU may have with respect to YOUR use of the SOCIOPROPHET
        website must be commenced within one (1) year after the claim or cause of action arises.
        These Terms set forth the entire understanding and agreement of the parties, and supersedes
        any and all oral or written agreements or understandings between the parties, as to their
        subject matter. The waiver of a breach of any provision of this Agreement shall not be
        construed as a waiver of any other or subsequent breach.
      </p>
      <h3 className="terms__heading">LINKS TO OTHER SITES AND/OR MATERIALS The SOCIOPROPHET </h3>
      <p className="terms__description">
        website contains links to sites owned or operated by independent third parties. These links
        are provided for YOUR convenience and reference only. WE do not control such sites and,
        therefore, WE are not responsible for any content posted on these sites. The fact that
        SOCIOPROPHET offers such links should not be construed in any way as an endorsement,
        authorization, or sponsorship of that site, its content or the companies or products
        referenced therein, and SOCIOPROPHET reserve the right to note its lack of affiliation,
        sponsorship, or endorsement on the SOCIOPROPHET website. If YOU decide to access any of the
        third party sites linked to by the SOCIOPROPHET website, YOU do this entirely at YOUR own
        risk. Because some sites employ automated search results or otherwise link YOU to sites
        containing information that may be deemed inappropriate or offensive, SOCIOPROPHET cannot be
        held responsible for the accuracy, copyright compliance, legality, or decency of material
        contained in third party sites, and YOU hereby irrevocably waive any claim against us with
        respect to such sites.
      </p>
      <h3 className="terms__heading">NOTIFICATION OF POSSIBLE COPYRIGHT INFRINGEMENT </h3>
      <p className="terms__description">
        In the event YOU believe that content published on the SOCIOPROPHET website may infringe on
        YOUR copyright or that of another, please contact us.
      </p>
      <h3 className="terms__heading">NOTIFICATION OF ILLEGAL CONTENT OR ACTIVITY </h3>
      <p className="terms__description">
        If YOU learn of any unlawful content or material on the SOCIOPROPHET website, or any
        material or activity that breaches these Terms and Conditions of Use, please contact us.
      </p>
      <h3 className="terms__heading">ENTIRE AGREEMENT </h3>
      <p className="terms__description">
        These Terms and Conditions of Use, together with OUR privacy and cookies policy, shall
        constitute the entire agreement between YOU and YOU and SOCIOPROPHET in relation to YOUR use
        of the SOCIOPROPHET website and shall supersede all previous agreements between YOU and
        SOCIOPROPHET in relation to YOUR use of the SOCIOPROPHET website.
      </p>
      <div className="terms__return">
        <Link className="terms__return__link" to="/">
          Return
        </Link>
      </div>
    </div>
  );
};

export default Terms;
