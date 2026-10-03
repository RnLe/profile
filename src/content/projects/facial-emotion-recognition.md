---
id: facial-emotion-recognition
slug: facial-emotion-recognition
title: Facial Emotion Recognition
shortTitle: Facial Emotions
oneLine: >-
  Seven architectures on one clean face dataset: ==how much does each gain
  from tuning==, and how small can the best get?
tagline: >-
  Seven architectures, one cleaned dataset: tuning, long training, grokking,
  and compression.
listLabel: Independent Study
activity: archived
yearStart: 2026
yearEnd: 2026
kinds:
  - learning
focus:
  learning: 'Computer vision · CNNs and vision transformers · Optuna tuning · grokking · low-rank compression · int8'
summary: >-
  A solo study on recognising seven emotions in faces. I merged two datasets
  into one clean set and trained **seven architectures** with one pipeline and
  the same tuning budget. The CNNs with batch norm lead and ==barely need
  tuning==. Follow-ups on the three winners tested longer training, grokking,
  and **compression**: ResNet-18 becomes 16 times smaller at its original
  accuracy.
placement: research-selected
lifecycle: released
evidenceLevel: empirical-study
statusDate: '2026-10-03'
statusNote: >-
  Finished study (2026). The code, the data pipeline, and every number on this
  page are in the repository; the follow-up experiments ran with one seed each.
publication: public
sourceVisibility: public
role: >-
  Solo study: data pipeline, seven model implementations, training, tuning,
  and the follow-up experiments.
domain: Machine learning · computer vision · model compression
dateRange: '2026'
methods:
  - PyTorch
  - Optuna (TPE)
  - fANOVA
  - Data cleaning
  - GPU augmentation
  - Warmup-stable-decay
  - Neural collapse
  - Low-rank factorisation
  - Tucker-2
  - int8 quantisation
applicationThemes:
  - computer-vision
  - model-compression
citations:
  - label: 'Goodfellow et al. (2013): Challenges in representation learning: a report on three machine learning contests (FER2013)'
    href: 'https://arxiv.org/abs/1307.0414'
  - label: 'Barsoum et al. (2016): Training deep networks for facial expression recognition with crowd-sourced label distribution (FER+)'
    href: 'https://arxiv.org/abs/1608.01041'
  - label: 'Li, Deng & Du (2017): Reliable crowdsourcing and deep locality-preserving learning for expression recognition in the wild (RAF-DB)'
    href: 'https://doi.org/10.1109/CVPR.2017.277'
  - label: 'Akiba et al. (2019): Optuna: a next-generation hyperparameter optimization framework'
    href: 'https://arxiv.org/abs/1907.10902'
  - label: 'Liu, Michaud & Tegmark (2023): Omnigrok: grokking beyond algorithmic data'
    href: 'https://arxiv.org/abs/2210.01117'
  - label: 'Zhang, Zou, He & Sun (2016): Accelerating very deep convolutional networks for classification and detection'
    href: 'https://arxiv.org/abs/1505.06798'
noveltyNote: >-
  The datasets, architectures, and methods are established. The contribution
  is a controlled comparison: seven architectures with one pipeline, one
  dataset, and equal tuning budgets, guesses written before each step, and
  follow-ups on long training, grokking, and compression measured the same
  way.
claimIds:
  - FER-ROLE-001
  - FER-DATA-001
  - FER-ARCH-001
  - FER-TUNE-001
  - FER-SHAPE-001
  - FER-LONG-001
  - FER-GROK-001
  - FER-COMP-001
  - FER-COMP-002
  - FER-COMP-003
cardClaimIds:
  - FER-COMP-001
mediaIds: []
figureIds: []
tabs:
  - id: overview
    label: Overview
    questions:
      - How much does each architecture ==gain from tuning==?
      - And how far can the best go with longer training, late generalisation, and compression?
    figureId: fer-pipeline
    paragraphs:
      - >-
        One cleaned dataset, seven architectures, one training pipeline, and
        the same tuning budget for each. Guesses were written down before every
        step. Every decision was made on the validation set; the test set only
        reports results.
    sections:
      - heading: How the study ran
        paragraphs:
          - >-
            **Data:** two public datasets merged and cleaned into 44,296 faces.
            **Architectures:** seven, from a plain CNN to a vision transformer,
            all trained from scratch. **Tuning:** 30 Optuna trials each, then
            the network's shape for the three winners.
          - >-
            **Grokking:** the three winners trained far longer, then the
            setting where grokking was shown on images. **Compression:** four
            methods, alone and combined, against networks trained small from
            scratch.
          - >-
            The study rebuilds an earlier course project from scratch, after
            that project's evaluation turned out to be invalid. Nothing from it
            is reused.
  - id: data
    label: Data
    questions:
      - Can two noisy face datasets be merged into ==one clean, more balanced set==?
    figureId: fer-classes
    paragraphs:
      - >-
        FER2013 has 35,887 faces with FER+ labels: ten votes per face. RAF-DB
        adds faces from the web, and the most where FER2013 is thinnest:
        disgust grows from 81 to 718 training faces.
    sections:
      - heading: Cleaning
        figureIds: [fer-cleaning]
        paragraphs:
          - >-
            A face was dropped when the annotators disagreed, when it was a
            near-duplicate (perceptual hash), or when its label was not one of
            the seven emotions. Duplicates never cross the train, validation
            and test split. **44,296 faces** remain.
      - heading: One format
        figureIds: [fer-samples]
        paragraphs:
          - >-
            All faces are 48 × 48 pixels in grayscale. RAF-DB faces were
            cropped to match FER2013's looser framing.
          - >-
            Augmentation runs on the GPU: flips, small rotations and shifts,
            brightness and contrast, and random erasing.
    citations:
      - label: 'Goodfellow et al. (2013): Challenges in representation learning: a report on three machine learning contests'
        href: 'https://arxiv.org/abs/1307.0414'
      - label: 'Barsoum et al. (2016): Training deep networks for facial expression recognition with crowd-sourced label distribution'
        href: 'https://arxiv.org/abs/1608.01041'
      - label: 'Li, Deng & Du (2017): Reliable crowdsourcing and deep locality-preserving learning for expression recognition in the wild'
        href: 'https://doi.org/10.1109/CVPR.2017.277'
      - label: 'Zauner (2010): Implementation and benchmarking of perceptual image hash functions'
        note: master’s thesis
      - label: 'Zhong et al. (2020): Random erasing data augmentation'
        href: 'https://arxiv.org/abs/1708.04896'
  - id: architectures
    label: Architectures
    questions:
      - Which architecture recognises emotions best, ==with its defaults and after tuning==?
    figureId: fer-arch-gain
    paragraphs:
      - >-
        Seven architectures, all trained from scratch on the same faces with
        the same pipeline. Batch norm decides the ranking: **ResNet-18, VGG and
        DenseNet** lead at about 85% and gain little from tuning. Tuning
        shrinks the spread between the models from 13 to 7 points.
    sections:
      - heading: Training curves
        figureIds: [fer-curves]
        paragraphs:
          - >-
            Each model trains 60 epochs with AdamW, a warmup, and a cosine
            decay. Validation accuracy settles in the last epochs, and the
            validation loss never turns up: ==no model overfits==.
      - heading: Where the errors are
        figureIds: [fer-confusion]
        paragraphs:
          - >-
            Disgust and fear are the hardest classes for every model. Both are
            rare, fear is often taken for surprise, and disgust for sadness or
            anger.
      - heading: Size
        figureIds: [fer-size-acc]
        paragraphs:
          - >-
            DenseNet matches ResNet-18 with **14 times fewer parameters**. An
            ImageNet-pretrained ResNet-18 is no better than the one trained
            from scratch.
    citations:
      - label: 'LeCun et al. (1998): Gradient-based learning applied to document recognition'
        href: 'https://doi.org/10.1109/5.726791'
      - label: 'Simonyan & Zisserman (2015): Very deep convolutional networks for large-scale image recognition'
        href: 'https://arxiv.org/abs/1409.1556'
      - label: 'Ioffe & Szegedy (2015): Batch normalization: accelerating deep network training by reducing internal covariate shift'
        href: 'https://arxiv.org/abs/1502.03167'
      - label: 'He et al. (2016): Deep residual learning for image recognition'
        href: 'https://arxiv.org/abs/1512.03385'
      - label: 'Huang et al. (2017): Densely connected convolutional networks'
        href: 'https://arxiv.org/abs/1608.06993'
      - label: 'Dosovitskiy et al. (2021): An image is worth 16x16 words: transformers for image recognition at scale'
        href: 'https://arxiv.org/abs/2010.11929'
      - label: 'Hassani et al. (2021): Escaping the big data paradigm with compact transformers'
        href: 'https://arxiv.org/abs/2104.05704'
      - label: 'Liu et al. (2022): A ConvNet for the 2020s'
        href: 'https://arxiv.org/abs/2201.03545'
      - label: 'Loshchilov & Hutter (2019): Decoupled weight decay regularization'
        href: 'https://arxiv.org/abs/1711.05101'
      - label: 'Szegedy et al. (2016): Rethinking the Inception architecture for computer vision (label smoothing)'
        href: 'https://arxiv.org/abs/1512.00567'
  - id: tuning
    label: Tuning
    questions:
      - How ==sensitive== is each architecture to its settings?
      - Does the network's shape matter, once the settings are tuned?
    figureId: fer-trials
    paragraphs:
      - >-
        Optuna tuned all seven with the same budget: 30 trials of 25 epochs,
        random first, then TPE, over eight settings such as learning rate,
        warmup, and class weights. The CNNs with batch norm score well almost
        anywhere; the others only in a narrow band.
    sections:
      - heading: What mattered
        figureIds: [fer-importance]
        paragraphs:
          - >-
            Warmup mattered most for four models, the learning rate for the two
            transformers, and class weighting for ResNet-18.
      - heading: The shape
        figureIds: [fer-shape]
        paragraphs:
          - >-
            For the three winners, width, depth, and the number of stages
            joined the search, with 40 more trials each. The best shapes gained
            0.2 points on the test set, within the noise. Smaller networks lost
            accuracy: ==the published sizes were already right==.
    citations:
      - label: 'Akiba et al. (2019): Optuna: a next-generation hyperparameter optimization framework'
        href: 'https://arxiv.org/abs/1907.10902'
      - label: 'Bergstra et al. (2011): Algorithms for hyper-parameter optimization (TPE)'
        href: 'https://papers.nips.cc/paper/4443-algorithms-for-hyper-parameter-optimization'
      - label: 'Hutter, Hoos & Leyton-Brown (2014): An efficient approach for assessing hyperparameter importance (fANOVA)'
        href: 'https://proceedings.mlr.press/v32/hutter14.html'
      - label: 'Jamieson & Talwalkar (2016): Non-stochastic best arm identification and hyperparameter optimization'
        href: 'https://arxiv.org/abs/1502.07943'
  - id: grokking
    label: Grokking
    questions:
      - Does training ==far longer== help?
      - Can a network generalise long after it has memorised its training set, as in ==grokking==?
    figureId: fer-grok
    paragraphs:
      - >-
        A simple CNN on 1,000 training faces, in the setting where grokking was
        shown on images: large initial weights, MSE loss, weight decay, and
        100,000 steps. Validation accuracy rises long after training accuracy
        reaches 100%, but gradually. ==There is no sudden jump.==
    sections:
      - heading: Longer training
        figureIds: [fer-long]
        paragraphs:
          - >-
            The three winners trained 100 epochs at a constant learning rate,
            then cooled down. None beats its 60-epoch result by more than the
            noise.
      - heading: Overfitting
        figureIds: [fer-overfit]
        paragraphs:
          - >-
            Without augmentation, label smoothing, and dropout, training
            accuracy keeps climbing while validation accuracy peaks at epoch 18
            and falls: the classic picture of overfitting.
      - heading: Batch norm blocks it
        figureIds: [fer-spikes]
        paragraphs:
          - >-
            VGG, trained on far past memorising, did not grok. With batch norm,
            weight decay cannot favour a simpler solution. It only raises the
            effective step size, until training breaks in spikes.
      - heading: What moves with the late rise
        figureIds: [fer-nc1]
        paragraphs:
          - >-
            Neural collapse falls tenfold during the late rise. This fits the
            view of grokking as a switch from lazy to rich learning: the large
            start first memorises with its random features, then learns new
            ones.
      - heading: Without batch norm
        figureIds: [fer-slingshot]
        paragraphs:
          - >-
            VGG without batch norm behaves like the simple CNN and ends lower.
            Its weight norm jumps about every 5,000 steps, the slingshot
            pattern of Adam. The jumps bring no gain.
    citations:
      - label: 'Power et al. (2022): Grokking: generalization beyond overfitting on small algorithmic datasets'
        href: 'https://arxiv.org/abs/2201.02177'
      - label: 'Liu, Michaud & Tegmark (2023): Omnigrok: grokking beyond algorithmic data'
        href: 'https://arxiv.org/abs/2210.01117'
      - label: 'Kumar et al. (2024): Grokking as the transition from lazy to rich training dynamics'
        href: 'https://arxiv.org/abs/2310.06110'
      - label: 'Papyan, Han & Donoho (2020): Prevalence of neural collapse during the terminal phase of deep learning training'
        href: 'https://doi.org/10.1073/pnas.2015509117'
      - label: 'Lobacheva et al. (2021): On the periodic behavior of neural network training with batch normalization and weight decay'
        href: 'https://arxiv.org/abs/2106.15739'
      - label: 'van Laarhoven (2017): L2 regularization versus batch and weight normalization'
        href: 'https://arxiv.org/abs/1706.05350'
      - label: 'Thilak et al. (2022): The slingshot mechanism: an empirical study of adaptive optimizers and the grokking phenomenon'
        href: 'https://arxiv.org/abs/2206.04817'
      - label: 'Golechha (2024): Progress measures for grokking on real-world tasks'
        href: 'https://arxiv.org/abs/2405.12755'
      - label: 'Truong et al. (2026): Spectral entropy collapse as a phase transition in delayed generalisation'
        href: 'https://arxiv.org/abs/2604.13123'
      - label: 'Hägele et al. (2024): Scaling laws and compute-optimal training beyond fixed training durations'
        href: 'https://arxiv.org/abs/2405.18392'
  - id: compression
    label: Compression
    questions:
      - How much ==smaller and faster== can the winners get without losing accuracy?
      - Which method works, and why?
    figureId: fer-tradeoff-resnet
    paragraphs:
      - >-
        Four methods, alone and combined: output-based low rank, Tucker-2, a
        spatial split of each 3 × 3 kernel, and int8. With ranks chosen per
        layer, a short repair, and int8, ResNet-18 becomes ==16 times smaller
        at its original test accuracy==.
    sections:
      - heading: Why it works
        figureIds: [fer-spectra]
        paragraphs:
          - >-
            The weights are close to full rank, but the layer outputs are not.
            In VGG's last convolution, 7 of 616 directions hold 95% of the
            output variance. Methods that compress the outputs win.
      - heading: Ranks per layer, then repair
        figureIds: [fer-repair]
        paragraphs:
          - >-
            One threshold for all layers breaks VGG: it cuts the last layers
            below the 6 directions that 7 classes need. Ranks chosen per layer
            from their measured effect avoid this, and 10 epochs of repair
            recover most of a deep cut.
      - heading: VGG and DenseNet
        figureIds: [fer-tradeoff-vgg, fer-tradeoff-densenet]
        paragraphs:
          - >-
            VGG holds 4 and 8 times fewer parameters only with low rank.
            DenseNet, already small, holds 2 times and breaks in int8.
      - heading: Speed depends on the hardware
        figureIds: [fer-speed]
        paragraphs:
          - >-
            On the GPU, every factorised model is slower for one face: more,
            thinner layers cost more launches. On one CPU thread, the closest
            to a browser, a compressed ResNet-18 is 6.8 times faster at 0.7
            points less.
      - heading: The fair baseline
        figureIds: [fer-scratch]
        paragraphs:
          - >-
            A network trained small from scratch is as good for VGG and
            ResNet-18, and better for DenseNet. Compression saves a training
            run; it finds no network that training would miss.
    citations:
      - label: 'Zhang, Zou, He & Sun (2016): Accelerating very deep convolutional networks for classification and detection'
        href: 'https://arxiv.org/abs/1505.06798'
      - label: 'Kim et al. (2016): Compression of deep convolutional neural networks for fast and low power mobile applications'
        href: 'https://arxiv.org/abs/1511.06530'
      - label: 'Jaderberg, Vedaldi & Zisserman (2014): Speeding up convolutional neural networks with low rank expansions'
        href: 'https://arxiv.org/abs/1405.3866'
      - label: 'Tai et al. (2016): Convolutional neural networks with low-rank regularization'
        href: 'https://arxiv.org/abs/1511.06067'
      - label: 'Denton et al. (2014): Exploiting linear structure within convolutional networks for efficient evaluation'
        href: 'https://arxiv.org/abs/1404.0736'
      - label: 'Lebedev et al. (2015): Speeding-up convolutional neural networks using fine-tuned CP-decomposition'
        href: 'https://arxiv.org/abs/1412.6553'
      - label: 'Novikov et al. (2015): Tensorizing neural networks'
        href: 'https://arxiv.org/abs/1509.06569'
      - label: 'Eckart & Young (1936): The approximation of one matrix by another of lower rank'
        href: 'https://doi.org/10.1007/BF02288367'
      - label: 'Jacob et al. (2018): Quantization and training of neural networks for efficient integer-arithmetic-only inference'
        href: 'https://arxiv.org/abs/1712.05877'
      - label: 'Hinton, Vinyals & Dean (2015): Distilling the knowledge in a neural network'
        href: 'https://arxiv.org/abs/1503.02531'
      - label: 'Liu et al. (2019): Rethinking the value of network pruning'
        href: 'https://arxiv.org/abs/1810.05270'
links:
  - label: Repository
    href: 'https://github.com/RnLe/facial_emotion_detection'
    kind: source
related: []
---

Facial emotion recognition sorts a face into one of seven emotions: angry,
disgust, fear, happy, neutral, sad, surprise. Papers usually report each model
after its own tuning, which hides how good an architecture is with sensible
defaults. Here every architecture gets the same data, the same pipeline, and
the <mark>same tuning budget</mark>.
