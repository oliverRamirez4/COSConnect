class Shelter:

    def __init__(self, title, bio, numTotBeds, numOpenBeds, womenOnly, youth, emergency, family, latitude, longitude):
        self.title = title
        self.bio = bio
        self.numTotBeds = numTotBeds
        self.numOpenBeds = numOpenBeds
        self.womenOnly = womenOnly
        self.youth = youth
        self.emergency = emergency
        self.family = family
        self.latitude = latitude
        self.longitude

    def setTitle(self, title):
        self.title = title

    def getTitle(self):
        return self.title
    
    def setBio(self, bio):
        self.bio = bio

    def getBio(self):
        return self.bio
    
    def setNumTotBeds(self, numTotBeds):
        self.numTotBeds = numTotBeds

    def getNumTotBeds(self):
        return self.numTotBeds
    
    def setNumOpenBeds(self, numOpenBeds):
        self.numOpenBeds = numOpenBeds

    def getNumOpenBeds(self):
        return self.numOpenBeds
    
    def addOpenBeds(self, numBeds):
        self.numOpenBeds += numBeds

    def removeOpenBeds(self, numBeds):
        self.numOpenBeds -= numBeds

    def getWomenOnly(self):
        return self.womenOnly

    def setWomenOnly(self, womenOnly):
         self.womenOnly = womenOnly

    def getYouth(self):
        return self.youth

    def setYouth(self, youth):
        self.youth = youth

    def getEmergency(self):
        return self.emergency

    def setEmergency(self, emergency):
        self.emergency = emergency

    def getFamily(self):
        return self.family

    def setFamily(self, family):
        self.family = family

    def getLatitude(self):
        return self.latitude

    def setLatitude(self, latitude):
        self.latitude = latitude
    
    def getLongitude(self):
        return self.longitude

    def setLongitude(self, longitude):
        self.longitude = longitude



    


    
