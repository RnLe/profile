---
id: geo-neural
slug: geo-neural
title: GeoNeural
shortTitle: GeoNeural
oneLine: >-
  Can a small neural network store terrain in ==fewer bytes than the best
  standard codecs==, and still tell water where to flow?
tagline: >-
  Compressing landscapes with neural terrain coders, and using geophysics to help reduce their errors.
activity: active
yearStart: 2026
kinds:
  - learning
  - theory
focus:
  learning: 'Neural compression · elevation models · entropy coding · confirmatory testing · PyTorch'
  theory: 'Landscape evolution · flow routing · inverse problems · Rust and WebAssembly'
summary: >-
  Elevation models from airborne laser scanning and satellites are huge: the
  1 m model of one German state holds about 34 billion heights. A neural
  terrain coder, a small network inside an error-bounded compressor, stored
  them in **17 to 26% fewer bytes** than the best standard codecs at errors
  of 5 to 50 cm, on seven regions it had never seen. Its errors still ==reroute some
  streams==. A second part brings in geophysics, from geological maps to
  learned landscape evolution, to help reduce those errors.
placement: research-selected
lifecycle: active-research
evidenceLevel: empirical-study
statusDate: '2026-10-04'
statusNote: >-
  Actively worked on. The compression test is complete; the geology,
  simulation and reconstruction studies are in progress, and their first
  results are marked as such.
publication: public
sourceVisibility: public
domain: Geospatial machine learning · Earth observation data · scientific computing
dateRange: '2026 – present'
wide: true
methods:
  - Digital elevation models
  - Airborne laser scanning (DGM1)
  - Error-bounded compression
  - Neural predictors (PyTorch)
  - Entropy coding (rANS)
  - Flow routing (D8)
  - Landscape evolution
  - Inverse problems
  - Super-resolution
  - Rust
  - WebAssembly
  - Three.js
applicationThemes:
  - geospatial-ml
  - scientific-computing
citations:
  - label: 'Liang et al. (2023): SZ3: a modular framework for composing prediction-based error-bounded lossy compressors'
    href: 'https://doi.org/10.1109/TBDATA.2022.3201176'
  - label: 'Lindstrom (2014): Fixed-rate compressed floating-point arrays (zfp)'
    href: 'https://doi.org/10.1109/TVCG.2014.2346458'
  - label: 'Li, Lindstrom & Clyne (2023): Lossy scientific data compression with SPERR'
    note: IPDPS 2023
  - label: 'Duda (2013): Asymmetric numeral systems: entropy coding combining speed of Huffman coding with compression rate of arithmetic coding'
    href: 'https://arxiv.org/abs/1311.2540'
  - label: 'Ballé, Laparra & Simoncelli (2017): End-to-end optimized image compression'
    href: 'https://arxiv.org/abs/1611.01704'
  - label: 'Dupont et al. (2022): COIN++: neural compression across modalities'
    href: 'https://arxiv.org/abs/2201.12904'
noveltyNote: >-
  The codecs, the entropy coder, flow routing and the landscape model are
  established tools. What is new is the test: every byte a decoder needs is
  counted, the bar is the best of five standard codecs, keeping the streams
  counts as much as saving bytes, and the rules were written down before the
  new regions were picked.
claimIds:
  - GEO-ROLE-001
  - GEO-DATA-001
  - GEO-H1-001
  - GEO-H1-002
  - GEO-CODER-001
  - GEO-DEC-001
  - GEO-H3-001
  - GEO-GEOL-001
  - GEO-FIELD-001
  - GEO-CLOS-001
  - GEO-IDENT-001
  - GEO-RECON-001
  - GEO-LIMIT-001
cardClaimIds: []
mediaIds: []
figureIds: []
tabs:
  - id: overview
    label: Overview
    questions:
      - Can a small neural network store terrain in ==fewer bytes== than the best standard codecs?
      - And does the smaller file still ==send water the same way==?
    figureId: geo-explorer
    sections:
      - heading: The neural predictor made smaller files on seven new regions
        figureIds: [geo-h1-ratio]
        paragraphs:
          - >-
            On seven regions the coder had never seen, it was **17 to 26%
            smaller** on average for errors from 5 to 50 cm, and 14 to 27%
            per region. At 1 m the gain shrinks to 6%, and not every region
            is smaller.
      - heading: The smaller files kept fewer streams in some regions
        question: Is a smaller file automatically a better file?
        paragraphs:
          - >-
            No. Trace where water would flow on the decoded map: in some
            regions the neural file kept fewer of the original streams than
            the best standard codec, and at 50 cm and 1 m in all seven. By
            the rule written down before the test, the answer to the main
            question is ==no==. The [Drainage](#drainage) part explains why.
      - heading: Six questions, and where they stand
        figureIds: [geo-hypotheses]
        paragraphs:
          - >-
            Four questions are about storing terrain, two about the physics
            that shapes it. Each had a yes-or-no rule set in advance, and a
            no counts as an answer. A side study asks whether a network can
            sharpen coarse maps.
    continued: >-
      **This project is actively worked on.** The compression test is
      complete. Next: a coder that also keeps the streams, then the full
      geology, physics and reconstruction studies.
  - id: compression
    label: Compression
    questions:
      - How can a file get smaller, if every height must stay ==within a fixed error==?
    figureId: geo-levels
    paragraphs:
      - >-
        The coder works like SZ3, a standard tool for scientific data, in the
        three steps above. Unlike photo compression, it promises a largest
        error for every single height. ==The better the guess, the smaller
        the file.==
      - >-
        The neural predictor is a network of just 3.7 kB. It sharpens each
        guess and says how sure it is, which lets the coder pack the
        prediction errors tighter. It travels inside every file, so no byte is left
        uncounted.
    sections:
      - heading: Every region got smaller
        figureIds: [geo-h1-regions]
        paragraphs:
          - >-
            At a largest error of 25 cm, the neural predictor beat SZ3 and
            SPERR, the two strongest standard codecs, in every region: the
            six development regions, each coded by a model that never saw
            it, and the seven new ones.
      - heading: About half the gain is the coder, half the network
        question: Is the saving really the neural network, or the coder around it?
        paragraphs:
          - >-
            Both. With the fixed predictor, a fixed formula in place of the
            network, the same coder is already **7 to 13% smaller** than the
            best standard codec. The network takes off ==another 11 to 15%==.
      - heading: A network for every map does not pay off
        question: Why not train a network for each map, so that it fits perfectly?
        figureIds: [geo-field]
        paragraphs:
          - >-
            That is how a neural field works: one network learns one map by
            heart. With every byte counted, it costs far more than it saves:
            on one region at 50 cm, it took 29 kB to store and saved 4.4 kB.
            One small network, trained once and shared, is the version that
            pays.
      - heading: Almost every byte is a coded prediction error
        figureIds: [geo-bytes]
        paragraphs:
          - >-
            A file is mostly coded prediction errors. The network is about 2%
            of a 25 cm file. At coarse errors of 1 m and more, the files get
            so small that the network becomes a large share, and the gain
            fades.
      - heading: Compared against the best of five standard codecs
        figureIds: [geo-conventional]
        paragraphs:
          - >-
            The first version of this project measured neural models against
            q32, a simple baseline, and did not count every byte. SZ3 needs
            only a quarter to two thirds of q32's bytes for the same largest
            error, so those early comparisons were too easy. This version
            takes the smallest file of five standard codecs, with SZ3 also
            tuned over 14 settings.
      - heading: Smaller files take longer to open
        question: What does the smaller file cost?
        figureIds: [geo-decode]
        paragraphs:
          - >-
            The neural decoder runs its small network once for every height.
            In a browser it opens a 10 by 10 km region in about 0.7 s, where
            SZ3 needs about 0.01 s. ==The bytes are paid for with time.==
      - heading: Try it in your browser
        figureIds: [geo-codec]
        paragraphs:
          - >-
            Compare the three files on two regions: their size, where their
            errors fall, and which streams they keep. The neural file is
            decoded right here by a Rust decoder compiled to WebAssembly,
            and checked bit for bit.
  - id: drainage
    label: Drainage
    questions:
      - At the same error, does the smaller file ==keep the streams==?
    paragraphs:
      - >-
        Water flows downhill, so a terrain map decides where streams form,
        which land drains into which river, and where a flood would spread.
        Flood maps, erosion and soil models, and hydrological forecasts all
        start from these flow paths. On flat ground, ==a few centimeters can
        send water the other way==.
      - >-
        To test this, the same routing runs on the original map and on every
        decoded one: small pits are filled, water flows to whichever of the
        eight neighbors is steepest downhill, and a stream starts where water
        from at least 5 hectares collects. Then the two stream maps are
        compared, allowing a shift of one cell: missing streams and new,
        false ones both lower the share of streams found again.
    sections:
      - heading: The streams check failed at every error
        figureIds: [geo-drainage]
        paragraphs:
          - >-
            At the same largest error, the best standard codec kept a few
            more streams, in some regions at every error and in all seven at
            50 cm and 1 m. The rule allowed the neural file to find at most
            1 percentage point fewer streams; in the worst region it found 2
            to 8 points fewer, depending on the error. So the answer is
            ==no==.
      - heading: The largest error is not the typical error
        question: Why would a smaller file lose streams, if every height stays within the limit?
        paragraphs:
          - >-
            The limit only caps the largest error; most heights are much
            closer. At coarse errors this coder spreads its errors more
            evenly over the allowed room, so its typical error (the
            root-mean-square error) is larger: at 50 cm it is **20 to 32%
            higher** than the best standard codec's.
          - >-
            Streams follow the typical error, not the largest one. The first
            version of the project already found that at a fixed largest
            error, the codec with the lowest typical error keeps the most
            streams. The same coder with the fixed predictor keeps about as
            many streams as with the network, so the cause is the coder, not
            the network.
      - heading: Extra precision near streams did not help
        question: Could the coder spend more precision where water runs?
        figureIds: [geo-h3]
        paragraphs:
          - >-
            The decoder can find likely streams on the coarse levels it
            already has, so no extra map is needed. On the development
            regions, no rule (tighter near streams or on gentle slopes)
            raised the share of streams found again by the required 5 points
            at the same file size. The answer is no.
    continued: >-
      **This part is actively worked on.** Next: a coder that keeps the typical
      error low at the same limit, tested on the development regions and
      then on a fresh set of new regions, since the seven are used up.
    citations:
      - label: "O'Callaghan & Mark (1984): The extraction of drainage networks from digital elevation data (D8)"
        href: 'https://doi.org/10.1016/S0734-189X(84)80011-0'
      - label: 'Barnes, Lehman & Mulla (2014): Priority-flood: an optimal depression-filling and watershed-labeling algorithm'
        href: 'https://doi.org/10.1016/j.cageo.2013.04.024'
  - id: priors
    label: Geology
    questions:
      - Rock shapes the land. Does a ==geological map== help store the terrain?
    figureId: geo-geology
    paragraphs:
      - >-
        Hard rock tends to form steep ridges, soft rock wide valleys. So the
        geological map of North Rhine-Westphalia (scale 1:100,000) went into
        the network as an extra input, one rock unit per 40 m cell. As
        controls, the network also got a blank map and the real map shifted
        by 2.56 km. If these help as much, the gain is not geology.
      - >-
        In a first test on two regions, the real map saved **up to 1.5%** of
        the coded terrain, more than either control, though in one of eight
        runs it saved nothing. That hints at real information, but storing
        the map (1.8 to 3.9 kB) costs more than it saves.
    sections:
      - heading: Training on simulated landscapes has started
        question: Can simulated landscapes teach the network what terrain looks like?
        paragraphs:
          - >-
            A second idea: train the network first on landscapes made by the
            physics simulation, and compare it with look-alike terrain made
            without physics. The 48 simulated and 48 look-alike maps are
            ready, and training has started.
    continued: >-
      **This part is actively worked on.** The full geology study (six
      regions, four controls) and the test of training on simulated
      landscapes are running and have no result yet. Next: finish both.
  - id: physics
    label: Physics
    questions:
      - Can a neural network take over part of a landscape simulation and ==stay accurate== for thousands of years?
      - Can a landscape's shape alone tell ==how fast it formed==, and for how long?
    figureId: geo-closure-arms
    paragraphs:
      - >-
        Landscapes form slowly: tectonics lifts the land, rivers cut into
        it, and soil creeps down the slopes. Simulations step this forward
        in time. A plain creep law misses how creep speeds up on steep
        slopes; a network could learn that from data. Here a small network
        replaces the soil-creep step, learned first from a known simulation,
        and has to stay accurate over 64 steps of 200 years on surfaces it
        has never seen.
    sections:
      - heading: Built-in physics keeps the network on track
        question: What keeps a learned step from drifting over thousands of years?
        paragraphs:
          - >-
            Six network designs were trained the same way. The best one
            cannot break two basic rules: flat ground stays flat, and no
            soil appears or vanishes. Averaged over the run, its height
            error is **1.34 m**, close to the 1.11 m that even a perfect copy
            of the simulation's 200-year step would have. A plain
            straight-line creep law is off by 3.91 m. Without its floor, a
            lower limit on the creep rate, the network's error grows to
            3.45 m. Three of the six designs break one of the two rules and
            were left out.
      - heading: Checked whether one survey can tell rate from age
        question: If every process ran twice as fast for half the time, would the landscape look different?
        figureIds: [geo-ident]
        paragraphs:
          - >-
            No, not in this model. Speed up every process and shorten the
            time to match, and the final landscape is exactly the same.
            Inferring causes from a result is an inverse problem, and here
            one survey can never settle it. In simulations, ==two surveys a
            fixed number of years apart can==, as long as the landscape is
            still changing (not yet in steady state).
      - heading: A fixed time-step cap made up information
        figureIds: [geo-ident-cap]
        paragraphs:
          - >-
            A shortcut, a fixed cap on the simulation's time step,
            made fast and slow landscapes look different, as if the surface
            held real information about its age. It is an artifact of the
            numerics, and it disappears when the steps are scaled correctly.
      - heading: Honest error bars need the right noise model
        question: How sure can a speed estimate be?
        figureIds: [geo-coverage]
        paragraphs:
          - >-
            Survey errors are correlated in space: neighboring points tend to
            be off in the same direction. In a first test, error bars from a
            model that knows this caught the true speed in 95 to 97% of
            cases, as 95% error bars should. Treating every point as
            independent caught it in only 37 to 50%.
      - heading: Run the simulation yourself
        figureIds: [geo-lab]
        paragraphs:
          - >-
            The simulation core, written in Rust and compiled to
            WebAssembly, runs here in your browser. Compare the selected
            network with the simulation, and with an early design that lets
            flat ground drift.
    continued: >-
      **This part is actively worked on.** Next: repeat the error-bar test on
      about 100 simulated landscapes, compare it with networks that read the
      speed straight from the map, test what happens when the simulation
      does not match reality.
    citations:
      - label: 'Roering, Kirchner & Dietrich (1999): Evidence for nonlinear, diffusive sediment transport on hillslopes'
        href: 'https://doi.org/10.1029/1998WR900090'
      - label: 'Whipple & Tucker (1999): Dynamics of the stream-power river incision model'
        href: 'https://doi.org/10.1029/1999JB900120'
      - label: 'Bar-Sinai et al. (2019): Learning data-driven discretizations for partial differential equations'
        href: 'https://doi.org/10.1073/pnas.1814058116'
  - id: reconstruction
    label: Reconstruction
    questions:
      - Can a network turn a coarse 40 m map into a sharp 10 m map, ==better than standard methods==?
    figureId: geo-recon
    paragraphs:
      - >-
        Many elevation models, especially those from satellites, are coarse.
        Here a U-Net, a common image network, learned to turn 40 m averages
        into 10 m heights. It was trained on four regions and tested on two
        others, and every result is corrected so that it averages back to
        the coarse input.
      - >-
        In a first test its mean error was **16 to 19% lower** than that of
        the best method without a network. Given single points instead of
        averages, it did worse than plain (bicubic) interpolation: much of
        what it learned was how the coarse map had been made.
    continued: >-
      **This part is actively worked on.** Next: the full study with gaps, sparse
      points and 1 m data, run once on the seven new regions.
  - id: evidence
    label: How it was tested
    questions:
      - How do you make sure a result is not ==tuned to its own test==?
    figureId: geo-cohort
    paragraphs:
      - >-
        By writing the rules down first. Before the final test, a protocol
        fixed the codecs, the error limits, the measures and the pass marks.
        Then a fixed rule picked seven new regions across the state, from
        flat to rough terrain, and the models were frozen. The final test
        ran once, and its result is reported as it came out.
      - >-
        Each result is an average over regions, with a range that shows how
        much it varies from region to region. One codec setting, the tuned
        SZ3, was added after the rules were set; it can only make the neural
        result harder to reach.
    sections:
      - heading: The rule, condition by condition
        figureIds: [geo-h1-rule]
        paragraphs:
          - >-
            File size passed at every error from 5 to 50 cm and failed at
            1 m. The streams condition failed at every error. One failed
            condition is enough for a no.
      - heading: Limits
        paragraphs:
          - >-
            Thirteen regions from one German state, all at 10 m; some new
            regions are neighbors, so they are not fully independent. The
            stream test compares maps; it does not simulate water. The
            physics runs on simulated landscapes, and at its default step the
            simulation's own error is larger than the rules allow for
            estimating rates. Timings come from a shared workstation.
      - heading: Data
        paragraphs:
          - >-
            Terrain from the DGM1 of Geobasis NRW (DL-DE-Zero-2.0). Geology
            from the GK100 of the Geological Survey of North Rhine-Westphalia
            (DL-DE-BY-2.0).
links:
  - label: Repository
    href: 'https://github.com/RnLe/geo-neural'
    kind: source
related: []
---

A digital elevation model is a map of heights: one number for every point on
a grid. Built from airborne laser scans and satellite data, these maps show
where rivers run, where floods spread and how landscapes change. They are also
<mark>very large</mark>: the 1&nbsp;m terrain model of North Rhine-Westphalia alone
holds about 34 billion heights.

GeoNeural asks whether a small neural network can store such maps in fewer
bytes, with **every height still within a fixed error**, say 25&nbsp;cm. It
competes against standard codecs, the programs that pack scientific data into
files and unpack them again. The map above shows one of the thirteen regions,
Essen-Ruhr: southern Essen and the Ruhr valley.
